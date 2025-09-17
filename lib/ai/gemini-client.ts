// lib/ai/gemini-client.ts
// Gemini API 클라이언트 구현
// Google Gemini API와의 통신을 담당하는 메인 클라이언트
// 관련 파일: lib/ai/types.ts, lib/ai/errors.ts, lib/ai/config.ts, lib/ai/utils.ts

import { GoogleGenAI } from '@google/genai'
import { GeminiConfig, GeminiRequest, GeminiResponse, AIService, APIUsageLog, GeminiErrorType } from './types'
import { GeminiError, createGeminiError, getSafeErrorMessage } from './errors'
import { getFinalConfig, logConfig } from './config'
import { 
  estimateTokens, 
  validateTokenLimit, 
  logAPIUsage, 
  withRetry, 
  measureLatency,
  truncateText 
} from './utils'

export class GeminiClient implements AIService {
  private client: GoogleGenAI
  private config: GeminiConfig
  private usageLogs: APIUsageLog[] = []

  constructor() {
    this.config = getFinalConfig()
    this.client = new GoogleGenAI({
      apiKey: this.config.apiKey
    })
    
    // 디버그 모드에서 설정 정보 로깅
    logConfig(this.config)
  }

  // 헬스체크 - API 연결 상태 확인
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.generateText('Hello')
      return !!result && result.length > 0
    } catch (error) {
      console.error('Gemini health check failed:', error)
      return false
    }
  }

  // 텍스트 생성 (기본 메서드)
  async generateText(prompt: string): Promise<string> {
    return this.generateTextWithOptions(prompt, {
      maxTokens: this.config.maxTokens,
      temperature: 0.7,
      topP: 0.9
    })
  }

  // 옵션을 포함한 텍스트 생성
  async generateTextWithOptions(
    prompt: string, 
    options: {
      maxTokens?: number
      temperature?: number
      topP?: number
      topK?: number
    } = {}
  ): Promise<string> {
    // 토큰 제한 검증
    const inputTokens = estimateTokens(prompt)
    const maxTokens = options.maxTokens || this.config.maxTokens
    const validation = validateTokenLimit(inputTokens, maxTokens)
    
    if (!validation.isValid) {
      throw new GeminiError(
        GeminiErrorType.QUOTA_EXCEEDED,
        `입력 텍스트가 너무 깁니다. 최대 ${validation.availableTokens} 토큰까지 허용됩니다.`
      )
    }

    // 토큰 제한에 맞춰 텍스트 자르기
    const processedPrompt = truncateText(prompt, validation.availableTokens)

    const request: GeminiRequest = {
      model: this.config.model,
      contents: processedPrompt,
      maxTokens: maxTokens,
      temperature: options.temperature,
      topP: options.topP,
      topK: options.topK
    }

    return this.executeRequest(request)
  }

  // API 요청 실행 (재시도 로직 포함)
  private async executeRequest(request: GeminiRequest): Promise<string> {
    const startTime = Date.now()
    
    try {
      const { result, latency } = await measureLatency(async () => {
        return await withRetry(async () => {
          const response = await this.client.models.generateContent({
            model: request.model,
            contents: request.contents,
            config: {
              maxOutputTokens: request.maxTokens,
              temperature: request.temperature,
              topP: request.topP,
              topK: request.topK
            }
          })
          
          return response.text
        })
      })

      // 사용량 로깅
      const usageLog: APIUsageLog = {
        timestamp: new Date(),
        model: request.model,
        inputTokens: estimateTokens(request.contents),
        outputTokens: estimateTokens(result || ''),
        latencyMs: latency,
        success: true
      }
      
      this.usageLogs.push(usageLog)
      logAPIUsage(usageLog)

      return result || ''

    } catch (error) {
      const latency = Date.now() - startTime
      
      // 에러 로깅
      const errorLog: APIUsageLog = {
        timestamp: new Date(),
        model: request.model,
        inputTokens: estimateTokens(request.contents),
        outputTokens: 0,
        latencyMs: latency,
        success: false,
        error: getSafeErrorMessage(createGeminiError(error))
      }
      
      this.usageLogs.push(errorLog)
      logAPIUsage(errorLog)

      // GeminiError로 변환하여 throw
      throw createGeminiError(error)
    }
  }

  // 토큰 수 추정
  estimateTokens(text: string): number {
    return estimateTokens(text)
  }

  // 사용량 통계 조회
  getUsageStats() {
    const totalRequests = this.usageLogs.length
    const successfulRequests = this.usageLogs.filter(log => log.success).length
    const totalTokens = this.usageLogs.reduce((sum, log) => sum + log.inputTokens + log.outputTokens, 0)
    const averageLatency = this.usageLogs.reduce((sum, log) => sum + log.latencyMs, 0) / totalRequests

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averageLatency: averageLatency || 0,
      totalTokens,
      recentLogs: this.usageLogs.slice(-10) // 최근 10개 로그
    }
  }

  // 설정 정보 조회
  getConfig(): Omit<GeminiConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config
    return safeConfig
  }

  // 사용량 로그 초기화
  clearUsageLogs(): void {
    this.usageLogs = []
  }
}

// 싱글톤 인스턴스 (선택적)
let geminiClientInstance: GeminiClient | null = null

export function getGeminiClient(): GeminiClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiClient()
  }
  return geminiClientInstance
}

// 테스트용 클라이언트 생성 (새로운 인스턴스)
export function createGeminiClient(): GeminiClient {
  return new GeminiClient()
}
