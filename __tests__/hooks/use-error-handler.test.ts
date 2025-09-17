// __tests__/hooks/use-error-handler.test.ts
// 에러 핸들링 훅 테스트
// 에러 상태 관리, 재시도 로직, 사용자 피드백 검증
// 관련 파일: hooks/use-error-handler.ts, lib/ai/error-handler.ts

import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { AIError } from '@/lib/ai/error-handler-client'

// Mock error handler functions
jest.mock('@/lib/ai/error-handler-client', () => ({
  getUserFriendlyMessage: jest.fn((error) => `User-friendly: ${error.message}`),
  canRecoverFromError: jest.fn((error) => error.retryable),
}))

describe('useErrorHandler', () => {
  const defaultOptions = {
    maxRetries: 3,
    userId: 'test-user',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))

      expect(result.current.hasError).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)
      expect(result.current.maxRetries).toBe(3)
      expect(result.current.canRetry).toBe(false)
      expect(result.current.lastRetryAt).toBe(null)
    })
  })

  describe('Error handling', () => {
    it('should set error when setError is called', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.hasError).toBe(true)
      expect(result.current.error).toEqual(error)
      expect(result.current.canRetry).toBe(true)
    })

    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.hasError).toBe(true)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.hasError).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.retryCount).toBe(0)
    })

    it('should not allow retry when max retries reached', () => {
      const { result } = renderHook(() => useErrorHandler({ ...defaultOptions, maxRetries: 2 }))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      // Set retry count to max
      act(() => {
        result.current.setError(error)
      })

      // Simulate reaching max retries
      act(() => {
        result.current.setError({ ...error, retryable: false })
      })

      expect(result.current.canRetry).toBe(false)
    })
  })

  describe('Execute with error handling', () => {
    it('should execute operation successfully', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn().mockResolvedValue('success')
      const context = { noteId: 'test-note', action: 'test' }

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.executeWithErrorHandling(operation, context)
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(executeResult.success).toBe(true)
      expect(executeResult.data).toBe('success')
      expect(result.current.hasError).toBe(false)
    })

    it('should handle operation failure', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
      const context = { noteId: 'test-note', action: 'test' }

      let executeResult: any
      await act(async () => {
        executeResult = await result.current.executeWithErrorHandling(operation, context)
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(executeResult.success).toBe(false)
      expect(executeResult.error).toBeDefined()
      expect(result.current.hasError).toBe(true)
    })

    it('should add context to error when provided', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
      const context = { noteId: 'test-note', action: 'test' }

      await act(async () => {
        await result.current.executeWithErrorHandling(operation, context)
      })

      expect(result.current.error?.context).toMatchObject(context)
    })
  })

  describe('Retry functionality', () => {
    it('should retry operation when retry is called', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success')
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      // Set initial error
      act(() => {
        result.current.setError(error)
      })

      let retryResult: any
      await act(async () => {
        retryResult = await result.current.retry(operation)
      })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(retryResult.success).toBe(false) // First attempt fails
    })

    it('should not retry when canRetry is false', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn()
      const error: AIError = {
        type: 'VALIDATION_ERROR',
        message: 'Validation error',
        retryable: false,
        severity: 'low',
      }

      act(() => {
        result.current.setError(error)
      })

      let retryResult: any
      await act(async () => {
        retryResult = await result.current.retry(operation)
      })

      expect(operation).not.toHaveBeenCalled()
      expect(retryResult.success).toBe(false)
    })

    it('should not retry when already retrying', async () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const operation = jest.fn()
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      // Start retry
      act(() => {
        result.current.retry(operation)
      })

      // Try to retry again while first retry is in progress
      let retryResult: any
      await act(async () => {
        retryResult = await result.current.retry(operation)
      })

      expect(operation).toHaveBeenCalledTimes(1) // Only called once
      expect(retryResult.success).toBe(false)
    })
  })

  describe('Callbacks', () => {
    it('should call onSuccess when operation succeeds', async () => {
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useErrorHandler({ ...defaultOptions, onSuccess }))
      
      const operation = jest.fn().mockResolvedValue('success')

      await act(async () => {
        await result.current.executeWithErrorHandling(operation)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onError when error occurs', async () => {
      const onError = jest.fn()
      const { result } = renderHook(() => useErrorHandler({ ...defaultOptions, onError }))
      
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))

      await act(async () => {
        await result.current.executeWithErrorHandling(operation)
      })

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should call onRetry when retry occurs', async () => {
      const onRetry = jest.fn()
      const { result } = renderHook(() => useErrorHandler({ ...defaultOptions, onRetry }))
      
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      await act(async () => {
        await result.current.retry(operation)
      })

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('User-friendly messages', () => {
    it('should provide user-friendly error message', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.userFriendlyMessage).toBe('User-friendly: Network error')
    })

    it('should provide error display info', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.errorDisplayInfo).toEqual({
        icon: '🌐',
        color: 'text-blue-600'
      })
    })
  })

  describe('Utility functions', () => {
    it('should correctly identify if max retries reached', () => {
      const { result } = renderHook(() => useErrorHandler({ ...defaultOptions, maxRetries: 2 }))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      // Simulate reaching max retries
      act(() => {
        result.current.setError({ ...error, retryable: false })
      })

      expect(result.current.isMaxRetries).toBe(true)
    })

    it('should correctly identify if has retryable error', () => {
      const { result } = renderHook(() => useErrorHandler(defaultOptions))
      
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium',
      }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.hasRetryableError).toBe(true)
    })
  })
})
