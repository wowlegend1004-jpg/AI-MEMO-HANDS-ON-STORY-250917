// __tests__/ai/actions.test.ts
// AI 서버 액션 테스트
// 서버 액션 함수들의 동작을 테스트
// 관련 파일: lib/ai/actions.ts, lib/ai/gemini-client.ts

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  generateText, 
  checkAIHealth, 
  getAIUsageStats,
  generateNoteSummary,
  generateNoteTags 
} from '@/lib/ai/actions'

// GeminiClient 모킹
vi.mock('@/lib/ai/gemini-client', () => ({
  getGeminiClient: vi.fn(() => ({
    generateText: vi.fn(),
    healthCheck: vi.fn(),
    getUsageStats: vi.fn()
  }))
}))

describe('AI Actions', () => {
  let mockClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { getGeminiClient } = require('@/lib/ai/gemini-client')
    mockClient = getGeminiClient()
  })

  describe('generateText', () => {
    test('성공적인 텍스트 생성', async () => {
      mockClient.generateText.mockResolvedValue('Generated text')

      const result = await generateText('Hello')
      
      expect(result.success).toBe(true)
      expect(result.text).toBe('Generated text')
      expect(result.error).toBeUndefined()
    })

    test('빈 프롬프트 처리', async () => {
      const result = await generateText('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('프롬프트가 비어있습니다.')
      expect(result.text).toBeUndefined()
    })

    test('API 에러 처리', async () => {
      mockClient.generateText.mockRejectedValue(new Error('API Error'))

      const result = await generateText('Hello')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('AI 서비스에 일시적인 문제가 발생했습니다.')
      expect(result.text).toBeUndefined()
    })
  })

  describe('checkAIHealth', () => {
    test('정상적인 헬스체크', async () => {
      mockClient.healthCheck.mockResolvedValue(true)

      const result = await checkAIHealth()
      
      expect(result.success).toBe(true)
      expect(result.isHealthy).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('헬스체크 실패', async () => {
      mockClient.healthCheck.mockResolvedValue(false)

      const result = await checkAIHealth()
      
      expect(result.success).toBe(true)
      expect(result.isHealthy).toBe(false)
      expect(result.error).toBeUndefined()
    })

    test('헬스체크 에러', async () => {
      mockClient.healthCheck.mockRejectedValue(new Error('Health check failed'))

      const result = await checkAIHealth()
      
      expect(result.success).toBe(false)
      expect(result.isHealthy).toBe(false)
      expect(result.error).toBe('AI 서비스 상태를 확인할 수 없습니다.')
    })
  })

  describe('getAIUsageStats', () => {
    test('사용량 통계 조회 성공', async () => {
      const mockStats = {
        totalRequests: 10,
        successRate: 90,
        averageLatency: 1500,
        totalTokens: 5000
      }
      mockClient.getUsageStats.mockReturnValue(mockStats)

      const result = await getAIUsageStats()
      
      expect(result.success).toBe(true)
      expect(result.stats).toEqual(mockStats)
      expect(result.error).toBeUndefined()
    })

    test('사용량 통계 조회 실패', async () => {
      mockClient.getUsageStats.mockImplementation(() => {
        throw new Error('Stats error')
      })

      const result = await getAIUsageStats()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('사용량 통계를 가져올 수 없습니다.')
      expect(result.stats).toBeUndefined()
    })
  })

  describe('generateNoteSummary', () => {
    test('노트 요약 생성 성공', async () => {
      const mockSummary = '• 핵심 내용 1\n• 핵심 내용 2\n• 핵심 내용 3'
      mockClient.generateText.mockResolvedValue(mockSummary)

      const result = await generateNoteSummary('노트 내용입니다.')
      
      expect(result.success).toBe(true)
      expect(result.summary).toBe(mockSummary)
      expect(result.error).toBeUndefined()
    })

    test('빈 노트 내용 처리', async () => {
      const result = await generateNoteSummary('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 내용이 비어있습니다.')
      expect(result.summary).toBeUndefined()
    })

    test('요약 생성 실패', async () => {
      mockClient.generateText.mockRejectedValue(new Error('Summary generation failed'))

      const result = await generateNoteSummary('노트 내용입니다.')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 요약 생성에 실패했습니다.')
      expect(result.summary).toBeUndefined()
    })
  })

  describe('generateNoteTags', () => {
    test('노트 태그 생성 성공', async () => {
      const mockResponse = '개발, 프로그래밍, JavaScript, 웹개발, 학습'
      mockClient.generateText.mockResolvedValue(mockResponse)

      const result = await generateNoteTags('JavaScript 프로그래밍에 대한 노트입니다.')
      
      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['개발', '프로그래밍', 'JavaScript', '웹개발', '학습'])
      expect(result.error).toBeUndefined()
    })

    test('빈 노트 내용 처리', async () => {
      const result = await generateNoteTags('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 내용이 비어있습니다.')
      expect(result.tags).toBeUndefined()
    })

    test('태그 생성 실패', async () => {
      mockClient.generateText.mockRejectedValue(new Error('Tag generation failed'))

      const result = await generateNoteTags('노트 내용입니다.')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('노트 태그 생성에 실패했습니다.')
      expect(result.tags).toBeUndefined()
    })

    test('태그 파싱 및 제한', async () => {
      const mockResponse = '태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7, 태그8'
      mockClient.generateText.mockResolvedValue(mockResponse)

      const result = await generateNoteTags('노트 내용입니다.')
      
      expect(result.success).toBe(true)
      expect(result.tags).toHaveLength(6) // 최대 6개로 제한
      expect(result.tags).toEqual(['태그1', '태그2', '태그3', '태그4', '태그5', '태그6'])
    })
  })
})
