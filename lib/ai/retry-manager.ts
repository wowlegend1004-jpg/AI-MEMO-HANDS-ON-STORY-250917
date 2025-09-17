// lib/ai/retry-manager.ts
// AI 요청 재시도 관리 시스템
// 지수 백오프, 최대 재시도 제한, 에러별 재시도 정책 관리
// 관련 파일: lib/ai/error-handler.ts, lib/ai/types.ts

import { AIError, getRetryDelay, canRecoverFromError } from './error-handler-client'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: AIError
  attempts: number
  totalDelay: number
}

// 기본 재시도 설정
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
}

// 재시도 매니저 클래스
export class RetryManager {
  private config: RetryConfig
  private activeRetries: Map<string, AbortController> = new Map()

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  // 비동기 함수를 재시도 로직과 함께 실행
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: {
      operationId?: string
      onRetry?: (attempt: number, error: AIError) => void
      onSuccess?: (result: T) => void
      onFailure?: (error: AIError) => void
    }
  ): Promise<RetryResult<T>> {
    const operationId = context?.operationId || `retry_${Date.now()}_${Math.random()}`
    const abortController = new AbortController()
    
    this.activeRetries.set(operationId, abortController)

    let lastError: AIError | undefined
    let totalDelay = 0
    let attempts = 0

    try {
      for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
        attempts = attempt

        try {
          // AbortController를 사용한 취소 확인
          if (abortController.signal.aborted) {
            throw new Error('Operation was cancelled')
          }

          const result = await operation()
          
          // 성공 시 콜백 호출
          context?.onSuccess?.(result)
          
          return {
            success: true,
            data: result,
            attempts,
            totalDelay,
          }
        } catch (error) {
          lastError = error as AIError

          // 재시도 불가능한 에러인 경우 즉시 중단
          if (!canRecoverFromError(lastError)) {
            break
          }

          // 마지막 시도인 경우 중단
          if (attempt > this.config.maxRetries) {
            break
          }

          // 재시도 콜백 호출
          context?.onRetry?.(attempt, lastError)

          // 재시도 지연 시간 계산
          const delay = this.calculateDelay(attempt, lastError)
          totalDelay += delay

          // 지연 대기
          await this.sleep(delay)
        }
      }

      // 모든 재시도 실패
      context?.onFailure?.(lastError!)
      
      return {
        success: false,
        error: lastError,
        attempts,
        totalDelay,
      }
    } finally {
      // 활성 재시도에서 제거
      this.activeRetries.delete(operationId)
    }
  }

  // 재시도 지연 시간 계산
  private calculateDelay(attempt: number, error: AIError): number {
    const baseDelay = getRetryDelay(error, attempt)
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)
    const delay = Math.min(Math.max(baseDelay, exponentialDelay), this.config.maxDelay)

    // 지터 추가 (동시 재시도 방지)
    if (this.config.jitter) {
      const jitterRange = delay * 0.1
      const jitter = (Math.random() - 0.5) * 2 * jitterRange
      return Math.max(0, delay + jitter)
    }

    return delay
  }

  // 비동기 대기
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 특정 작업 취소
  cancel(operationId: string): boolean {
    const controller = this.activeRetries.get(operationId)
    if (controller) {
      controller.abort()
      this.activeRetries.delete(operationId)
      return true
    }
    return false
  }

  // 모든 활성 재시도 취소
  cancelAll(): void {
    for (const [operationId, controller] of this.activeRetries) {
      controller.abort()
    }
    this.activeRetries.clear()
  }

  // 활성 재시도 수 조회
  getActiveRetryCount(): number {
    return this.activeRetries.size
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // 현재 설정 조회
  getConfig(): RetryConfig {
    return { ...this.config }
  }
}

// 싱글톤 인스턴스
let retryManagerInstance: RetryManager | null = null

export function getRetryManager(): RetryManager {
  if (!retryManagerInstance) {
    retryManagerInstance = new RetryManager()
  }
  return retryManagerInstance
}

// 특정 에러 타입별 재시도 정책
export const RETRY_POLICIES: Record<AIError['type'], Partial<RetryConfig>> = {
  API_ERROR: { maxRetries: 2, baseDelay: 2000 },
  NETWORK_ERROR: { maxRetries: 5, baseDelay: 1000 },
  QUOTA_EXCEEDED: { maxRetries: 1, baseDelay: 60000 }, // 1분 후 1회만 재시도
  TIMEOUT: { maxRetries: 3, baseDelay: 1500 },
  VALIDATION_ERROR: { maxRetries: 0 }, // 재시도 불가
  SERVER_ERROR: { maxRetries: 2, baseDelay: 3000 },
  UNKNOWN_ERROR: { maxRetries: 1, baseDelay: 2000 },
}

// 에러 타입에 따른 재시도 매니저 생성
export function createRetryManagerForError(errorType: AIError['type']): RetryManager {
  const policy = RETRY_POLICIES[errorType] || {}
  return new RetryManager(policy)
}
