// __tests__/ai/gemini-client.test.ts
// Gemini 클라이언트 테스트
// API 연동, 에러 처리, 토큰 제한 등을 테스트
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { GeminiClient } from '@/lib/ai/gemini-client'
import { GeminiError } from '@/lib/ai/errors'

// 환경변수 모킹
vi.mock('@/lib/ai/config', () => ({
  getFinalConfig: () => ({
    apiKey: 'test-api-key',
    model: 'gemini-2.0-flash-001',
    maxTokens: 8192,
    timeout: 10000,
    debug: true,
    rateLimitPerMinute: 60
  }),
  logConfig: vi.fn()
}))

// GoogleGenAI 모킹
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn()
    }
  }))
}))

describe('GeminiClient', () => {
  let client: GeminiClient
  let mockGenerateContent: any

  beforeEach(() => {
    vi.clearAllMocks()
    client = new GeminiClient()
    
    // 모킹된 generateContent 함수 참조
    const { GoogleGenAI } = require('@google/genai')
    const mockClient = new GoogleGenAI()
    mockGenerateContent = mockClient.models.generateContent
  })

  describe('초기화', () => {
    test('클라이언트가 올바르게 초기화되어야 한다', () => {
      expect(client).toBeDefined()
      expect(client.estimateTokens).toBeDefined()
      expect(client.healthCheck).toBeDefined()
      expect(client.generateText).toBeDefined()
    })

    test('설정 정보를 올바르게 반환해야 한다', () => {
      const config = client.getConfig()
      expect(config.model).toBe('gemini-2.0-flash-001')
      expect(config.maxTokens).toBe(8192)
      expect(config.timeout).toBe(10000)
      expect(config.debug).toBe(true)
    })
  })

  describe('텍스트 생성', () => {
    test('성공적인 텍스트 생성', async () => {
      const mockResponse = {
        text: 'Hello, world!'
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await client.generateText('Hello')
      expect(result).toBe('Hello, world!')
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-001',
        contents: 'Hello',
        config: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          topP: 0.9,
          topK: undefined
        }
      })
    })

    test('API 에러 처리', async () => {
      const mockError = new Error('API Error')
      mockGenerateContent.mockRejectedValue(mockError)

      await expect(client.generateText('Hello')).rejects.toThrow()
    })

    test('빈 프롬프트 처리', async () => {
      await expect(client.generateText('')).rejects.toThrow()
    })
  })

  describe('헬스체크', () => {
    test('정상적인 헬스체크', async () => {
      const mockResponse = {
        text: 'Hello'
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const isHealthy = await client.healthCheck()
      expect(isHealthy).toBe(true)
    })

    test('API 에러 시 헬스체크 실패', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'))

      const isHealthy = await client.healthCheck()
      expect(isHealthy).toBe(false)
    })
  })

  describe('토큰 추정', () => {
    test('토큰 수를 올바르게 추정해야 한다', () => {
      const text = 'Hello, world!'
      const tokens = client.estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
      expect(typeof tokens).toBe('number')
    })

    test('긴 텍스트의 토큰 추정', () => {
      const longText = 'a'.repeat(1000)
      const tokens = client.estimateTokens(longText)
      expect(tokens).toBeGreaterThan(100)
    })
  })

  describe('사용량 통계', () => {
    test('초기 사용량 통계', () => {
      const stats = client.getUsageStats()
      expect(stats.totalRequests).toBe(0)
      expect(stats.successRate).toBe(0)
      expect(stats.averageLatency).toBe(0)
      expect(stats.totalTokens).toBe(0)
    })

    test('사용량 로그 초기화', () => {
      client.clearUsageLogs()
      const stats = client.getUsageStats()
      expect(stats.totalRequests).toBe(0)
    })
  })

  describe('옵션을 포함한 텍스트 생성', () => {
    test('커스텀 옵션으로 텍스트 생성', async () => {
      const mockResponse = {
        text: 'Custom response'
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const result = await client.generateTextWithOptions('Hello', {
        maxTokens: 1000,
        temperature: 0.5,
        topP: 0.8
      })

      expect(result).toBe('Custom response')
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-001',
        contents: 'Hello',
        config: {
          maxOutputTokens: 1000,
          temperature: 0.5,
          topP: 0.8,
          topK: undefined
        }
      })
    })
  })
})
