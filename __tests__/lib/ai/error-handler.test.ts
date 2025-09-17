// __tests__/lib/ai/error-handler.test.ts
// AI 에러 핸들러 테스트
// 에러 분류, 로깅, 사용자 메시지 생성 기능 검증
// 관련 파일: lib/ai/error-handler.ts, lib/ai/errors.ts

import { 
  classifyError, 
  getUserFriendlyMessage, 
  canRecoverFromError,
  getRetryDelay,
  ERROR_SEVERITY 
} from '@/lib/ai/error-handler-client'
import { AIError } from '@/lib/ai/error-handler-client'
import { GeminiError, GeminiErrorType } from '@/lib/ai/errors'

// Mock database
jest.mock('@/lib/db/connection', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue([])
    })
  }
}))

describe('AI Error Handler', () => {
  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('네트워크 연결에 문제가 있습니다.')
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(error, context)
      
      expect(result.type).toBe('NETWORK_ERROR')
      expect(result.retryable).toBe(true)
      expect(result.severity).toBe('medium')
      expect(result.context).toEqual(context)
    })

    it('should classify timeout errors correctly', () => {
      const error = new Error('요청 시간이 초과되었습니다.')
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(error, context)
      
      expect(result.type).toBe('TIMEOUT')
      expect(result.retryable).toBe(true)
      expect(result.severity).toBe('medium')
    })

    it('should classify quota exceeded errors correctly', () => {
      const error = new Error('API 할당량을 초과했습니다.')
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(error, context)
      
      expect(result.type).toBe('QUOTA_EXCEEDED')
      expect(result.retryable).toBe(false)
      expect(result.severity).toBe('high')
    })

    it('should classify validation errors correctly', () => {
      const error = new Error('입력 유효성 검사에 실패했습니다.')
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(error, context)
      
      expect(result.type).toBe('VALIDATION_ERROR')
      expect(result.retryable).toBe(false)
      expect(result.severity).toBe('low')
    })

    it('should classify unknown errors as UNKNOWN_ERROR', () => {
      const error = new Error('알 수 없는 오류')
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(error, context)
      
      expect(result.type).toBe('UNKNOWN_ERROR')
      expect(result.retryable).toBe(false)
      expect(result.severity).toBe('medium')
    })

    it('should handle GeminiError correctly', () => {
      const geminiError = new GeminiError(
        GeminiErrorType.NETWORK_ERROR,
        'Network connection failed',
        new Error('Original error')
      )
      const context = { noteId: 'test-note', userId: 'test-user' }
      
      const result = classifyError(geminiError, context)
      
      expect(result.type).toBe('NETWORK_ERROR')
      expect(result.retryable).toBe(true)
      expect(result.originalError).toBe(geminiError)
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages for different error types', () => {
      const errorTypes: AIError['type'][] = [
        'API_ERROR',
        'NETWORK_ERROR', 
        'QUOTA_EXCEEDED',
        'TIMEOUT',
        'VALIDATION_ERROR',
        'SERVER_ERROR',
        'UNKNOWN_ERROR'
      ]

      errorTypes.forEach(type => {
        const error: AIError = {
          type,
          message: 'Test error',
          retryable: false,
          severity: 'medium'
        }

        const message = getUserFriendlyMessage(error)
        expect(message).toBeTruthy()
        expect(message).not.toContain('Test error') // Should be user-friendly, not technical
      })
    })
  })

  describe('canRecoverFromError', () => {
    it('should return true for retryable errors', () => {
      const retryableError: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium'
      }

      expect(canRecoverFromError(retryableError)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const nonRetryableError: AIError = {
        type: 'VALIDATION_ERROR',
        message: 'Validation error',
        retryable: false,
        severity: 'low'
      }

      expect(canRecoverFromError(nonRetryableError)).toBe(false)
    })

    it('should return false for critical errors even if retryable', () => {
      const criticalError: AIError = {
        type: 'SERVER_ERROR',
        message: 'Server error',
        retryable: true,
        severity: 'critical'
      }

      expect(canRecoverFromError(criticalError)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const error: AIError = {
        type: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
        severity: 'medium'
      }

      const delay1 = getRetryDelay(error, 1)
      const delay2 = getRetryDelay(error, 2)
      const delay3 = getRetryDelay(error, 3)

      expect(delay1).toBeGreaterThan(0)
      expect(delay2).toBeGreaterThan(delay1)
      expect(delay3).toBeGreaterThan(delay2)
    })

    it('should return 0 for non-retryable errors', () => {
      const error: AIError = {
        type: 'VALIDATION_ERROR',
        message: 'Validation error',
        retryable: false,
        severity: 'low'
      }

      const delay = getRetryDelay(error, 1)
      expect(delay).toBe(0)
    })

    it('should apply minimum delay for quota exceeded errors', () => {
      const error: AIError = {
        type: 'QUOTA_EXCEEDED',
        message: 'Quota exceeded',
        retryable: true,
        severity: 'high'
      }

      const delay = getRetryDelay(error, 1)
      expect(delay).toBeGreaterThanOrEqual(60000) // At least 1 minute
    })
  })

  // logError는 서버 전용이므로 클라이언트 테스트에서 제외
})
