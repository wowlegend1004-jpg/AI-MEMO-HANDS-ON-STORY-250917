// hooks/use-error-handler.ts
// AI 에러 처리 상태 관리 훅
// 에러 상태, 재시도 로직, 사용자 피드백을 통합 관리
// 관련 파일: lib/ai/error-handler.ts, lib/ai/retry-manager.ts, components/ai/error-display.tsx

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AIError, getUserFriendlyMessage, canRecoverFromError } from '@/lib/ai/error-handler-client'
import { RetryManager, RetryResult } from '@/lib/ai/retry-manager'

export interface ErrorState {
  hasError: boolean
  error: AIError | null
  isRetrying: boolean
  retryCount: number
  maxRetries: number
  canRetry: boolean
  lastRetryAt: Date | null
}

export interface UseErrorHandlerOptions {
  maxRetries?: number
  onError?: (error: AIError) => void
  onRetry?: (attempt: number, error: AIError) => void
  onSuccess?: () => void
  onFailure?: (error: AIError) => void
  autoRetry?: boolean
  userId?: string
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    onError,
    onRetry,
    onSuccess,
    onFailure,
    autoRetry = false,
    userId,
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
    maxRetries,
    canRetry: false,
    lastRetryAt: null,
  })

  const retryManagerRef = useRef<RetryManager | null>(null)
  const operationIdRef = useRef<string | null>(null)

  // 에러 상태 초기화
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
      maxRetries,
      canRetry: false,
      lastRetryAt: null,
    })
  }, [maxRetries])

  // 에러 설정
  const setError = useCallback((error: AIError) => {
    const canRetry = canRecoverFromError(error) && errorState.retryCount < maxRetries

    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error,
      canRetry,
      lastRetryAt: null,
    }))

    // 에러 로깅은 서버에서 처리
    // 클라이언트에서는 콘솔에만 기록
    console.error('AI Error:', {
      type: error?.type || 'UNKNOWN_ERROR',
      message: error?.message || '알 수 없는 오류가 발생했습니다.',
      details: error?.details || {},
      severity: error?.severity || 'medium',
      retryable: error?.retryable || false,
      context: error?.context || {},
      originalError: error?.originalError || error,
      fullError: error
    })

    // 에러 콜백 호출
    onError?.(error)
  }, [errorState.retryCount, maxRetries, userId, onError])

  // 재시도 실행
  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!errorState.canRetry || errorState.isRetrying) {
      return { success: false, error: errorState.error }
    }

    const operationId = `retry_${Date.now()}_${Math.random()}`
    operationIdRef.current = operationId

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      lastRetryAt: new Date(),
    }))

    try {
      const retryManager = retryManagerRef.current || new RetryManager({ maxRetries: 1 })
      retryManagerRef.current = retryManager

      const result = await retryManager.executeWithRetry(operation, {
        operationId,
        onRetry: (attempt, error) => {
          onRetry?.(attempt, error)
        },
        onSuccess: () => {
          clearError()
          onSuccess?.()
        },
        onFailure: (error) => {
          setError(error)
          onFailure?.(error)
        },
      })

      return result
    } catch (error) {
      const aiError = error as AIError
      setError(aiError)
      return { success: false, error: aiError }
    } finally {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }))
      operationIdRef.current = null
    }
  }, [errorState.canRetry, errorState.isRetrying, errorState.error, clearError, onRetry, onSuccess, onFailure, setError])

  // 에러와 함께 비동기 작업 실행
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: { noteId?: string; action?: string }
  ): Promise<{ success: boolean; data?: T; error?: AIError }> => {
    try {
      const data = await operation()
      clearError()
      return { success: true, data }
    } catch (error) {
      const aiError = error as AIError
      if (context) {
        aiError.context = {
          ...aiError.context,
          ...context,
          timestamp: new Date(),
        }
      }
      setError(aiError)
      return { success: false, error: aiError }
    }
  }, [clearError, setError])

  // 자동 재시도 설정
  useEffect(() => {
    if (autoRetry && errorState.hasError && errorState.canRetry && !errorState.isRetrying) {
      const timer = setTimeout(() => {
        // 자동 재시도는 현재 에러를 기반으로 할 수 없으므로
        // 외부에서 제공된 operation이 필요합니다
        console.warn('Auto retry requires an operation to be provided')
      }, 2000) // 2초 후 자동 재시도

      return () => clearTimeout(timer)
    }
  }, [autoRetry, errorState.hasError, errorState.canRetry, errorState.isRetrying])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (retryManagerRef.current && operationIdRef.current) {
        retryManagerRef.current.cancel(operationIdRef.current)
      }
    }
  }, [])

  // 사용자 친화적 에러 메시지
  const userFriendlyMessage = errorState.error ? getUserFriendlyMessage(errorState.error) : ''

  // 에러 타입별 아이콘과 색상
  const getErrorDisplayInfo = (error: AIError | null) => {
    if (!error) return { icon: '⚠️', color: 'text-red-600' }

    switch (error.type) {
      case 'NETWORK_ERROR':
        return { icon: '🌐', color: 'text-blue-600' }
      case 'TIMEOUT':
        return { icon: '⏱️', color: 'text-orange-600' }
      case 'QUOTA_EXCEEDED':
        return { icon: '📊', color: 'text-purple-600' }
      case 'API_ERROR':
        return { icon: '🔧', color: 'text-red-600' }
      case 'VALIDATION_ERROR':
        return { icon: '📝', color: 'text-yellow-600' }
      case 'SERVER_ERROR':
        return { icon: '🖥️', color: 'text-red-700' }
      default:
        return { icon: '⚠️', color: 'text-red-600' }
    }
  }

  return {
    // 상태
    ...errorState,
    userFriendlyMessage,
    errorDisplayInfo: getErrorDisplayInfo(errorState.error),
    
    // 액션
    setError,
    clearError,
    retry,
    executeWithErrorHandling,
    
    // 유틸리티
    canRetry: errorState.canRetry && !errorState.isRetrying,
    isMaxRetries: errorState.retryCount >= maxRetries,
    hasRetryableError: errorState.hasError && errorState.canRetry,
  }
}
