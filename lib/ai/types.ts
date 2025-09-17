// lib/ai/types.ts
// AI 서비스 관련 타입 정의
// Gemini API 요청/응답 타입과 AI 서비스 공통 인터페이스를 정의
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/errors.ts, lib/ai/config.ts

// Gemini API 기본 타입
export interface GeminiRequest {
  model: string
  contents: string
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
}

export interface GeminiResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
  safetyRatings?: Array<{
    category: string
    probability: string
  }>
}

// AI 서비스 공통 인터페이스
export interface AIService {
  generateText(prompt: string): Promise<string>
  healthCheck(): Promise<boolean>
  estimateTokens(text: string): number
}

// 설정 관련 타입
export interface GeminiConfig {
  apiKey: string
  model: string
  maxTokens: number
  timeout: number
  debug: boolean
  rateLimitPerMinute: number
}

// 사용량 로깅 타입
export interface APIUsageLog {
  timestamp: Date
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
  error?: string
  userId?: string
}

// 에러 타입
export enum GeminiErrorType {
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN = 'UNKNOWN'
}

// 재시도 설정 타입
export interface RetryConfig {
  maxRetries: number
  backoffMs: number
  retryableErrors: GeminiErrorType[]
}

// 토큰 제한 검증 결과
export interface TokenValidationResult {
  isValid: boolean
  inputTokens: number
  maxTokens: number
  reservedTokens: number
  availableTokens: number
}

// 요약 관련 타입
export interface SummaryResult {
  success: boolean
  summary?: string
  error?: string
  noteId?: string
}

export interface SummaryGenerationRequest {
  noteId: string
  content: string
  forceRegenerate?: boolean
}

export interface SummaryValidationResult {
  isValid: boolean
  minLength: number
  currentLength: number
  reason?: string
}

// 태그 관련 타입
export interface TagResult {
  success: boolean
  tags?: string[]
  error?: string
  noteId?: string
}

export interface TagGenerationRequest {
  noteId: string
  content: string
  forceRegenerate?: boolean
}

export interface TagValidationResult {
  isValid: boolean
  minLength: number
  currentLength: number
  reason?: string
}

// AI 처리 상태 관련 타입
export type AIProcessStatus = 'idle' | 'loading' | 'success' | 'error' | 'timeout'

export interface AIProcessState {
  status: AIProcessStatus
  progress?: number // 0-100
  message?: string
  error?: unknown
  retryCount?: number
  maxRetries?: number
}

export interface AIJob {
  id: string
  type: 'summary' | 'tags'
  noteId: string
  status: AIProcessStatus
  startTime: number
  timeout?: number
}

export interface AIStatusUpdate {
  jobId: string
  status: AIProcessStatus
  progress?: number
  message?: string
  error?: unknown
}