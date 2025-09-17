// hooks/use-retry.ts
// 재시도 로직 전용 훅
// 간단한 재시도 기능이 필요한 컴포넌트에서 사용
// 관련 파일: lib/ai/retry-manager.ts, hooks/use-error-handler.ts

'use client'

import { useState, useCallback, useRef } from 'react'
import { RetryManager, RetryConfig, RetryResult } from '@/lib/ai/retry-manager'
import { AIError } from '@/lib/ai/error-handler'

export interface UseRetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
  onRetry?: (attempt: number, error: AIError) => void
  onSuccess?: (result: any) => void
  onFailure?: (error: AIError) => void
}

export interface RetryState {
  isRetrying: boolean
  retryCount: number
  maxRetries: number
  lastError: AIError | null
  canRetry: boolean
}

export function useRetry(options: UseRetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    onRetry,
    onSuccess,
    onFailure,
  } = options

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    maxRetries,
    lastError: null,
    canRetry: true,
  })

  const retryManagerRef = useRef<RetryManager | null>(null)
  const operationIdRef = useRef<string | null>(null)

  // 재시도 매니저 초기화
  const getRetryManager = useCallback(() => {
    if (!retryManagerRef.current) {
      retryManagerRef.current = new RetryManager({
        maxRetries,
        baseDelay,
        maxDelay,
        backoffMultiplier,
        jitter,
      })
    }
    return retryManagerRef.current
  }, [maxRetries, baseDelay, maxDelay, backoffMultiplier, jitter])

  // 재시도 실행
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId?: string
  ): Promise<RetryResult<T>> => {
    if (retryState.isRetrying) {
      return {
        success: false,
        error: retryState.lastError || undefined,
        attempts: retryState.retryCount,
        totalDelay: 0,
      }
    }

    const id = operationId || `retry_${Date.now()}_${Math.random()}`
    operationIdRef.current = id

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      lastError: null,
    }))

    try {
      const retryManager = getRetryManager()
      const result = await retryManager.executeWithRetry(operation, {
        operationId: id,
        onRetry: (attempt, error) => {
          setRetryState(prev => ({
            ...prev,
            retryCount: attempt,
            lastError: error,
          }))
          onRetry?.(attempt, error)
        },
        onSuccess: (data) => {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            retryCount: 0,
            lastError: null,
            canRetry: true,
          }))
          onSuccess?.(data)
        },
        onFailure: (error) => {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            lastError: error,
            canRetry: false,
          }))
          onFailure?.(error)
        },
      })

      return result
    } catch (error) {
      const aiError = error as AIError
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: aiError,
        canRetry: false,
      }))
      onFailure?.(aiError)

      return {
        success: false,
        error: aiError,
        attempts: retryState.retryCount,
        totalDelay: 0,
      }
    } finally {
      operationIdRef.current = null
    }
  }, [retryState.isRetrying, retryState.retryCount, getRetryManager, onRetry, onSuccess, onFailure])

  // 재시도 취소
  const cancelRetry = useCallback(() => {
    if (operationIdRef.current && retryManagerRef.current) {
      retryManagerRef.current.cancel(operationIdRef.current)
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
      }))
      operationIdRef.current = null
    }
  }, [])

  // 재시도 상태 초기화
  const resetRetry = useCallback(() => {
    if (retryManagerRef.current && operationIdRef.current) {
      retryManagerRef.current.cancel(operationIdRef.current)
    }
    
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      maxRetries,
      lastError: null,
      canRetry: true,
    })
    
    operationIdRef.current = null
  }, [maxRetries])

  // 재시도 가능 여부 확인
  const canRetry = retryState.canRetry && !retryState.isRetrying && retryState.retryCount < maxRetries

  // 최대 재시도 도달 여부
  const isMaxRetries = retryState.retryCount >= maxRetries

  return {
    // 상태
    ...retryState,
    canRetry,
    isMaxRetries,
    
    // 액션
    retry,
    cancelRetry,
    resetRetry,
    
    // 유틸리티
    hasError: !!retryState.lastError,
    isActive: retryState.isRetrying,
  }
}
