// lib/ai/errors.ts
// AI 서비스 에러 정의 및 처리
// Gemini API 에러를 분류하고 적절한 에러 메시지를 제공
// 관련 파일: lib/ai/types.ts, lib/ai/gemini-client.ts

import { GeminiErrorType } from './types'

export class GeminiError extends Error {
  constructor(
    public type: GeminiErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

// 에러 타입별 메시지 매핑
const ERROR_MESSAGES: Record<GeminiErrorType, string> = {
  [GeminiErrorType.API_KEY_INVALID]: 'API 키가 유효하지 않습니다. 환경변수를 확인해주세요.',
  [GeminiErrorType.QUOTA_EXCEEDED]: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  [GeminiErrorType.TIMEOUT]: 'API 요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.',
  [GeminiErrorType.CONTENT_FILTERED]: '요청한 내용이 정책에 의해 차단되었습니다.',
  [GeminiErrorType.NETWORK_ERROR]: '네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.',
  [GeminiErrorType.RATE_LIMIT_EXCEEDED]: '요청 빈도가 너무 높습니다. 잠시 후 다시 시도해주세요.',
  [GeminiErrorType.UNKNOWN]: '알 수 없는 오류가 발생했습니다.'
}

// 원본 에러를 GeminiError로 변환
export function createGeminiError(error: unknown): GeminiError {
  const errorType = classifyError(error)
  const message = ERROR_MESSAGES[errorType]
  
  return new GeminiError(errorType, message, error)
}

// 에러 분류 로직
function classifyError(error: unknown): GeminiErrorType {
  if (!error) return GeminiErrorType.UNKNOWN

  const errorObj = error as Record<string, unknown>
  const errorMessage = (errorObj.message as string)?.toLowerCase() || ''
  const errorCode = Number(errorObj.code || errorObj.status) || 0

  // API 키 관련 에러
  if (errorCode === 401 || errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
    return GeminiErrorType.API_KEY_INVALID
  }

  // 할당량 초과 에러
  if (errorCode === 429 || errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
    return GeminiErrorType.QUOTA_EXCEEDED
  }

  // 타임아웃 에러
  if (errorCode === 408 || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return GeminiErrorType.TIMEOUT
  }

  // 콘텐츠 필터링 에러
  if (errorCode === 400 && (errorMessage.includes('safety') || errorMessage.includes('filtered'))) {
    return GeminiErrorType.CONTENT_FILTERED
  }

  // 네트워크 에러
  if (errorCode >= 500 || errorMessage.includes('network') || errorMessage.includes('connection')) {
    return GeminiErrorType.NETWORK_ERROR
  }

  // 속도 제한 에러
  if (errorCode === 429 || errorMessage.includes('rate limit')) {
    return GeminiErrorType.RATE_LIMIT_EXCEEDED
  }

  return GeminiErrorType.UNKNOWN
}

// 재시도 가능한 에러인지 확인
export function isRetryableError(error: GeminiError): boolean {
  const retryableTypes = [
    GeminiErrorType.TIMEOUT,
    GeminiErrorType.NETWORK_ERROR,
    GeminiErrorType.RATE_LIMIT_EXCEEDED
  ]
  
  return retryableTypes.includes(error.type)
}

// 사용자에게 표시할 안전한 에러 메시지 생성
export function getSafeErrorMessage(error: GeminiError): string {
  // 민감한 정보가 포함된 에러는 일반적인 메시지로 대체
  if (error.type === GeminiErrorType.API_KEY_INVALID) {
    return 'AI 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.'
  }
  
  return error.message
}
