// lib/ai/config.ts
// AI 서비스 설정 관리
// 환경변수를 통한 Gemini API 설정 및 검증
// 관련 파일: lib/ai/types.ts, .env.local

import { GeminiConfig } from './types'

// 환경변수에서 Gemini 설정 가져오기
export function getGeminiConfig(): GeminiConfig {
  const config: GeminiConfig = {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192'),
    timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '10000'),
    debug: process.env.GEMINI_DEBUG === 'true',
    rateLimitPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT || '60')
  }

  // 필수 설정 검증
  validateConfig(config)

  return config
}

// 설정 검증
function validateConfig(config: GeminiConfig): void {
  if (!config.apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  if (config.maxTokens <= 0 || config.maxTokens > 32000) {
    throw new Error('GEMINI_MAX_TOKENS는 1-32000 범위여야 합니다.')
  }

  if (config.timeout <= 0 || config.timeout > 60000) {
    throw new Error('GEMINI_TIMEOUT_MS는 1-60000 범위여야 합니다.')
  }

  if (config.rateLimitPerMinute <= 0 || config.rateLimitPerMinute > 1000) {
    throw new Error('GEMINI_RATE_LIMIT는 1-1000 범위여야 합니다.')
  }
}

// 환경별 설정 오버라이드
export function getEnvironmentConfig(): Partial<GeminiConfig> {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return {
        debug: false,
        rateLimitPerMinute: 30, // 프로덕션에서는 더 보수적으로
        timeout: 15000 // 프로덕션에서는 더 긴 타임아웃
      }
    
    case 'development':
    default:
      return {
        debug: true,
        rateLimitPerMinute: 60,
        timeout: 10000
      }
  }
}

// 최종 설정 병합
export function getFinalConfig(): GeminiConfig {
  const baseConfig = getGeminiConfig()
  const envConfig = getEnvironmentConfig()
  
  return {
    ...baseConfig,
    ...envConfig
  }
}

// 설정 정보 로깅 (디버그 모드에서만)
export function logConfig(config: GeminiConfig): void {
  if (config.debug) {
    console.log('[Gemini Config]', {
      model: config.model,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
      debug: config.debug,
      rateLimitPerMinute: config.rateLimitPerMinute,
      hasApiKey: !!config.apiKey
    })
  }
}
