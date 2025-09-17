// lib/ai/error-handler-client.ts
// 클라이언트 전용 AI 에러 핸들링 시스템
// 서버 의존성 없이 클라이언트에서 사용할 수 있는 에러 처리 로직
// 관련 파일: lib/ai/error-handler.ts, hooks/use-error-handler.ts

import { GeminiError, isRetryableError, getSafeErrorMessage } from './errors'
import { GeminiErrorType } from './types'

// 확장된 AI 에러 타입 정의 (클라이언트용)
export interface AIError {
  type: 'API_ERROR' | 'NETWORK_ERROR' | 'QUOTA_EXCEEDED' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'
  message: string
  details?: Record<string, unknown>
  retryable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  originalError?: unknown
  context?: {
    noteId?: string
    userId?: string
    action?: string
    timestamp?: Date
  }
}

// 에러 심각도 레벨 정의
export const ERROR_SEVERITY = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
} as const

// 에러 타입별 심각도 매핑
const ERROR_SEVERITY_MAP: Record<AIError['type'], AIError['severity']> = {
  API_ERROR: ERROR_SEVERITY.HIGH,
  NETWORK_ERROR: ERROR_SEVERITY.MEDIUM,
  QUOTA_EXCEEDED: ERROR_SEVERITY.HIGH,
  TIMEOUT: ERROR_SEVERITY.MEDIUM,
  VALIDATION_ERROR: ERROR_SEVERITY.LOW,
  SERVER_ERROR: ERROR_SEVERITY.CRITICAL,
  UNKNOWN_ERROR: ERROR_SEVERITY.MEDIUM,
}

// GeminiError를 AIError로 변환
export function convertToAIError(geminiError: GeminiError, context?: AIError['context']): AIError {
  const type = mapGeminiErrorType(geminiError.type)
  
  return {
    type,
    message: getSafeErrorMessage(geminiError),
    details: {
      originalType: geminiError.type,
      originalMessage: geminiError.message,
    },
    retryable: isRetryableError(geminiError),
    severity: ERROR_SEVERITY_MAP[type],
    originalError: geminiError.originalError,
    context,
  }
}

// GeminiErrorType을 AIError 타입으로 매핑
function mapGeminiErrorType(geminiType: GeminiErrorType): AIError['type'] {
  switch (geminiType) {
    case GeminiErrorType.API_KEY_INVALID:
    case GeminiErrorType.CONTENT_FILTERED:
      return 'API_ERROR'
    case GeminiErrorType.QUOTA_EXCEEDED:
    case GeminiErrorType.RATE_LIMIT_EXCEEDED:
      return 'QUOTA_EXCEEDED'
    case GeminiErrorType.TIMEOUT:
      return 'TIMEOUT'
    case GeminiErrorType.NETWORK_ERROR:
      return 'NETWORK_ERROR'
    default:
      return 'UNKNOWN_ERROR'
  }
}

// 일반 에러를 AIError로 변환
export function classifyError(error: unknown, context?: AIError['context']): AIError {
  if (error instanceof GeminiError) {
    return convertToAIError(error, context)
  }

  // 일반 JavaScript 에러 처리
  const errorObj = error as Error
  const errorMessage = errorObj.message || '알 수 없는 오류가 발생했습니다.'
  
  let type: AIError['type'] = 'UNKNOWN_ERROR'
  let retryable = false

  // 에러 메시지 기반 분류
  if (errorMessage.includes('네트워크') || errorMessage.includes('연결')) {
    type = 'NETWORK_ERROR'
    retryable = true
  } else if (errorMessage.includes('시간 초과') || errorMessage.includes('타임아웃')) {
    type = 'TIMEOUT'
    retryable = true
  } else if (errorMessage.includes('할당량') || errorMessage.includes('제한')) {
    type = 'QUOTA_EXCEEDED'
    retryable = false
  } else if (errorMessage.includes('유효성') || errorMessage.includes('검증')) {
    type = 'VALIDATION_ERROR'
    retryable = false
  }

  return {
    type,
    message: errorMessage,
    details: {
      name: errorObj.name,
      stack: errorObj.stack,
    },
    retryable,
    severity: ERROR_SEVERITY_MAP[type],
    originalError: error,
    context,
  }
}

// 사용자 친화적 에러 메시지 생성
export function getUserFriendlyMessage(error: AIError): string {
  const messages: Record<AIError['type'], string> = {
    API_ERROR: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    NETWORK_ERROR: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
    QUOTA_EXCEEDED: 'AI 서비스 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    TIMEOUT: '요청 처리 시간이 초과되었습니다. 다시 시도해주세요.',
    VALIDATION_ERROR: '입력한 내용에 문제가 있습니다. 내용을 확인해주세요.',
    SERVER_ERROR: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    UNKNOWN_ERROR: '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요.',
  }

  return messages[error.type] || messages.UNKNOWN_ERROR
}

// 에러 복구 가능 여부 확인
export function canRecoverFromError(error: AIError): boolean {
  return error.retryable && error.severity !== ERROR_SEVERITY.CRITICAL
}

// 에러별 재시도 지연 시간 계산 (지수 백오프)
export function getRetryDelay(error: AIError, attempt: number): number {
  if (!error.retryable) return 0

  const baseDelay = 1000 // 1초
  const maxDelay = 30000 // 30초
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
  
  // 에러 타입별 추가 지연
  if (error.type === 'QUOTA_EXCEEDED') {
    return Math.max(delay, 60000) // 최소 1분
  }
  
  return delay
}
