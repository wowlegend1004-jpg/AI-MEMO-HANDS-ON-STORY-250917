// __tests__/ai/summary-actions.test.ts
// 요약 생성 서버 액션 테스트
// 요약 생성, 조회, 삭제 기능의 단위 테스트를 수행
// 관련 파일: lib/ai/summary-actions.ts, lib/ai/gemini-client.ts

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { 
  generateSummary, 
  getSummary,
  regenerateSummary,
  deleteSummary 
} from '@/lib/ai/summary-actions'
import { validateNoteContent } from '@/lib/ai/summary-utils'
import { SummaryGenerationRequest } from '@/lib/ai/types'

// Mock dependencies
jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis()
  }
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  }))
}))

jest.mock('@/lib/ai/gemini-client', () => ({
  getGeminiClient: jest.fn(() => ({
    generateText: jest.fn().mockResolvedValue('• 첫 번째 요약 포인트\n• 두 번째 요약 포인트\n• 세 번째 요약 포인트')
  }))
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

describe('validateNoteContent', () => {
  test('should validate note content length correctly', () => {
    // Valid content
    const validContent = 'a'.repeat(150)
    const result = validateNoteContent(validContent)
    
    expect(result.isValid).toBe(true)
    expect(result.currentLength).toBe(150)
    expect(result.minLength).toBe(100)
  })

  test('should reject content that is too short', () => {
    const shortContent = 'a'.repeat(50)
    const result = validateNoteContent(shortContent)
    
    expect(result.isValid).toBe(false)
    expect(result.currentLength).toBe(50)
    expect(result.minLength).toBe(100)
    expect(result.reason).toContain('너무 짧습니다')
  })

  test('should handle empty content', () => {
    const emptyContent = ''
    const result = validateNoteContent(emptyContent)
    
    expect(result.isValid).toBe(false)
    expect(result.currentLength).toBe(0)
    expect(result.reason).toContain('너무 짧습니다')
  })
})

describe('generateSummary', () => {
  const mockRequest: SummaryGenerationRequest = {
    noteId: 'test-note-id',
    content: 'a'.repeat(200),
    forceRegenerate: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should generate summary successfully', async () => {
    // Mock database responses
    const mockDb = require('@/lib/db/connection').db
    mockDb.select.mockResolvedValueOnce([{ id: 'test-note-id', userId: 'test-user-id', content: 'a'.repeat(200) }])
    mockDb.insert.mockResolvedValueOnce([{ id: 'summary-id', content: '• 요약 내용' }])

    const result = await generateSummary(mockRequest)

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.noteId).toBe('test-note-id')
  })

  test('should reject content that is too short', async () => {
    const shortRequest = {
      ...mockRequest,
      content: 'a'.repeat(50)
    }

    const result = await generateSummary(shortRequest)

    expect(result.success).toBe(false)
    expect(result.error).toContain('너무 짧습니다')
  })

  test('should handle authentication error', async () => {
    const mockSupabase = require('@/lib/supabase/server').createClient
    mockSupabase.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Auth error')
        })
      }
    })

    const result = await generateSummary(mockRequest)

    expect(result.success).toBe(false)
    expect(result.error).toContain('인증이 필요합니다')
  })

  test('should handle note not found', async () => {
    const mockDb = require('@/lib/db/connection').db
    mockDb.select.mockResolvedValueOnce([]) // No note found

    const result = await generateSummary(mockRequest)

    expect(result.success).toBe(false)
    expect(result.error).toContain('노트를 찾을 수 없습니다')
  })
})

describe('getSummary', () => {
  test('should retrieve existing summary', async () => {
    const mockDb = require('@/lib/db/connection').db
    mockDb.select
      .mockResolvedValueOnce([{ id: 'test-note-id', userId: 'test-user-id' }]) // Note exists
      .mockResolvedValueOnce([{ content: '• 기존 요약 내용' }]) // Summary exists

    const result = await getSummary('test-note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBe('• 기존 요약 내용')
  })

  test('should return null when no summary exists', async () => {
    const mockDb = require('@/lib/db/connection').db
    mockDb.select
      .mockResolvedValueOnce([{ id: 'test-note-id', userId: 'test-user-id' }]) // Note exists
      .mockResolvedValueOnce([]) // No summary

    const result = await getSummary('test-note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBeUndefined()
  })
})

describe('regenerateSummary', () => {
  test('should regenerate summary successfully', async () => {
    const mockDb = require('@/lib/db/connection').db
    mockDb.select.mockResolvedValueOnce([{ 
      id: 'test-note-id', 
      userId: 'test-user-id', 
      content: 'a'.repeat(200) 
    }])
    mockDb.insert.mockResolvedValueOnce([{ id: 'summary-id', content: '• 새로운 요약' }])

    const result = await regenerateSummary('test-note-id')

    expect(result.success).toBe(true)
    expect(result.summary).toBeDefined()
  })
})

describe('deleteSummary', () => {
  test('should delete summary successfully', async () => {
    const mockDb = require('@/lib/db/connection').db
    mockDb.select.mockResolvedValueOnce([{ id: 'test-note-id', userId: 'test-user-id' }])
    mockDb.delete.mockResolvedValueOnce([])

    const result = await deleteSummary('test-note-id')

    expect(result.success).toBe(true)
    expect(result.noteId).toBe('test-note-id')
  })
})
