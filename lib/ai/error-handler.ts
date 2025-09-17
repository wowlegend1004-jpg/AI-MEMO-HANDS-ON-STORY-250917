// lib/ai/error-handler.ts
// AI 처리 에러 핸들링 시스템
// 에러 분류, 로깅, 사용자 피드백을 통합 관리
// 관련 파일: lib/ai/errors.ts, lib/ai/types.ts, lib/db/schema/error_logs.ts

import { db } from '@/lib/db/connection'
import { errorLogs } from '@/lib/db/schema/error_logs'
import { eq, and, gte, desc, count } from 'drizzle-orm'
import { GeminiError, isRetryableError, getSafeErrorMessage } from './errors'
import { GeminiErrorType } from './types'

// 확장된 AI 에러 타입 정의
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

// 에러 로그를 데이터베이스에 저장
export async function logError(error: AIError, userId: string): Promise<void> {
  try {
    await db.insert(errorLogs).values({
      userId,
      errorType: error.type,
      errorMessage: error.message,
      errorDetails: error.details,
      severity: error.severity,
      context: error.context,
      resolved: false,
    })
  } catch (logError) {
    // 에러 로깅 실패는 콘솔에만 기록 (무한 루프 방지)
    console.error('Failed to log error to database:', logError)
  }
}

// 에러 통계 조회
export async function getErrorStats(userId: string, days: number = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const stats = await db
    .select({
      errorType: errorLogs.errorType,
      severity: errorLogs.severity,
      count: errorLogs.id,
    })
    .from(errorLogs)
    .where(
      and(
        eq(errorLogs.userId, userId),
        gte(errorLogs.createdAt, since)
      )
    )
    .groupBy(errorLogs.errorType, errorLogs.severity)

  return stats
}

// 에러 해결 상태 업데이트
export async function markErrorResolved(errorId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .update(errorLogs)
      .set({ resolved: true })
      .where(
        and(
          eq(errorLogs.id, errorId),
          eq(errorLogs.userId, userId)
        )
      )
      .returning({ id: errorLogs.id })

    return result.length > 0
  } catch {
    return false
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
