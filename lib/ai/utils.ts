// lib/ai/utils.ts
// AI 서비스 유틸리티 함수
// 토큰 계산, 사용량 추적, 재시도 로직 등을 제공
// 관련 파일: lib/ai/types.ts, lib/ai/errors.ts

import { APIUsageLog, TokenValidationResult, RetryConfig, GeminiErrorType } from './types'
import { GeminiError, isRetryableError } from './errors'

// 토큰 수 추정 (대략적인 계산)
export function estimateTokens(text: string): number {
  // 대략적인 토큰 수 계산 (1 토큰 ≈ 4 문자)
  // 실제로는 더 정확한 계산이 필요하지만, 기본적인 제한을 위해 사용
  return Math.ceil(text.length / 4)
}

// 토큰 제한 검증
export function validateTokenLimit(
  inputTokens: number,
  maxTokens: number = 8192
): TokenValidationResult {
  const reservedTokens = 2000 // 응답용 토큰 여유분
  const availableTokens = maxTokens - reservedTokens
  
  return {
    isValid: inputTokens <= availableTokens,
    inputTokens,
    maxTokens,
    reservedTokens,
    availableTokens
  }
}

// 사용량 로깅
export function logAPIUsage(log: APIUsageLog): void {
  // 개발 환경에서는 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Gemini API Usage]', {
      ...log,
      timestamp: log.timestamp.toISOString()
    })
  }

  // 프로덕션에서는 실제 로깅 시스템으로 전송
  // TODO: 로깅 시스템 연동 (예: Winston, Pino 등)
}

// 재시도 로직
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    backoffMs: 1000,
    retryableErrors: [
      GeminiErrorType.TIMEOUT,
      GeminiErrorType.NETWORK_ERROR,
      GeminiErrorType.RATE_LIMIT_EXCEEDED
    ]
  }
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // GeminiError인 경우 재시도 가능 여부 확인
      if (error instanceof GeminiError) {
        if (!isRetryableError(error)) {
          throw error
        }
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < config.maxRetries) {
        const delay = config.backoffMs * Math.pow(2, attempt - 1) // 지수 백오프
        console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  throw lastError!
}

// 대기 함수
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// API 응답 시간 측정
export function measureLatency<T>(operation: () => Promise<T>): Promise<{ result: T; latency: number }> {
  const startTime = Date.now()
  
  return operation().then(result => {
    const latency = Date.now() - startTime
    return { result, latency }
  })
}

// 텍스트 전처리 (토큰 제한을 위한)
export function truncateText(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text)
  
  if (estimatedTokens <= maxTokens) {
    return text
  }
  
  // 토큰 제한에 맞춰 텍스트 자르기
  const maxChars = maxTokens * 4 // 대략적인 문자 수
  const truncated = text.substring(0, maxChars)
  
  // 문장 경계에서 자르기 (마지막 완전한 문장까지만)
  const lastSentenceEnd = truncated.lastIndexOf('.')
  if (lastSentenceEnd > maxChars * 0.8) { // 80% 이상이면 문장 경계에서 자르기
    return truncated.substring(0, lastSentenceEnd + 1)
  }
  
  return truncated + '...'
}

// 안전한 에러 메시지 생성 (민감한 정보 제거)
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.'
  
  const errorObj = error as Record<string, unknown>
  const message = (errorObj.message as string) || error.toString()
  
  // 민감한 정보 패턴 제거
  const sensitivePatterns = [
    /api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/gi,
    /token[:\s=]+[a-zA-Z0-9_.-]+/gi,
    /password[:\s=]+[^\s]+/gi,
    /secret[:\s=]+[^\s]+/gi
  ]
  
  let sanitized = message
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  })
  
  return sanitized
}

// 사용량 통계 계산
export function calculateUsageStats(logs: APIUsageLog[]): {
  totalRequests: number
  successRate: number
  averageLatency: number
  totalTokens: number
} {
  if (logs.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageLatency: 0,
      totalTokens: 0
    }
  }
  
  const successfulLogs = logs.filter(log => log.success)
  const totalTokens = logs.reduce((sum, log) => sum + log.inputTokens + log.outputTokens, 0)
  const averageLatency = logs.reduce((sum, log) => sum + log.latencyMs, 0) / logs.length
  
  return {
    totalRequests: logs.length,
    successRate: (successfulLogs.length / logs.length) * 100,
    averageLatency,
    totalTokens
  }
}
