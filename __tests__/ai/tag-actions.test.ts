// __tests__/ai/tag-actions.test.ts
// 태그 생성 서버 액션 테스트
// 태그 생성, 조회, 재생성, 삭제 기능에 대한 단위 테스트
// 관련 파일: lib/ai/tag-actions.ts, lib/ai/gemini-client.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  generateTags, 
  getTags, 
  regenerateTags, 
  deleteTags 
} from '@/lib/ai/tag-actions'

// Mock dependencies
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  })
}))

vi.mock('@/lib/ai/gemini-client', () => ({
  getGeminiClient: vi.fn().mockReturnValue({
    generateText: vi.fn().mockResolvedValue('tag1, tag2, tag3')
  })
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Tag Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('generateTags', () => {
    it('should generate tags successfully for valid content', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id', content: 'test content' }
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.select.mockResolvedValueOnce([]) // 기존 태그 조회
      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      })
      mockDb.db.select.mockResolvedValueOnce([{ tag: 'tag1' }, { tag: 'tag2' }, { tag: 'tag3' }]) // 최종 태그 조회

      const result = await generateTags({
        noteId: 'note-1',
        content: 'This is a test note with enough content to generate tags. It should be at least 100 characters long to pass validation.',
        forceRegenerate: false
      })

      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3'])
      expect(result.noteId).toBe('note-1')
    })

    it('should return error for content shorter than 100 characters', async () => {
      const result = await generateTags({
        noteId: 'note-1',
        content: 'Short content',
        forceRegenerate: false
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('최소 100자 이상의 내용이 필요합니다')
    })

    it('should return existing tags when not forcing regeneration', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id', content: 'test content' }
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.select.mockResolvedValueOnce([{ tag: 'existing-tag' }]) // 기존 태그 조회
      mockDb.db.select.mockResolvedValueOnce([{ tag: 'existing-tag' }]) // 최종 태그 조회

      const result = await generateTags({
        noteId: 'note-1',
        content: 'This is a test note with enough content to generate tags. It should be at least 100 characters long to pass validation.',
        forceRegenerate: false
      })

      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['existing-tag'])
    })

    it('should return error for unauthenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated')
          })
        }
      } as unknown as any)

      const result = await generateTags({
        noteId: 'note-1',
        content: 'This is a test note with enough content to generate tags.',
        forceRegenerate: false
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('should return error for note not found', async () => {
      const mockDb = await import('@/lib/db/connection')
      
      mockDb.db.select.mockResolvedValueOnce([]) // 노트 조회 실패

      const result = await generateTags({
        noteId: 'note-1',
        content: 'This is a test note with enough content to generate tags.',
        forceRegenerate: false
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없거나 권한이 없습니다.')
    })
  })

  describe('getTags', () => {
    it('should retrieve tags successfully', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id' }
      const mockTags = [{ tag: 'tag1' }, { tag: 'tag2' }]
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.select.mockResolvedValueOnce(mockTags) // 태그 조회

      const result = await getTags('note-1')

      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['tag1', 'tag2'])
      expect(result.noteId).toBe('note-1')
    })

    it('should return empty array when no tags exist', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id' }
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.select.mockResolvedValueOnce([]) // 태그 조회

      const result = await getTags('note-1')

      expect(result.success).toBe(true)
      expect(result.tags).toEqual([])
    })
  })

  describe('regenerateTags', () => {
    it('should regenerate tags successfully', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id', content: 'test content' }
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // generateTags에서 노트 조회
      mockDb.db.select.mockResolvedValueOnce([]) // 기존 태그 조회
      mockDb.db.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      })
      mockDb.db.select.mockResolvedValueOnce([{ tag: 'new-tag1' }, { tag: 'new-tag2' }]) // 최종 태그 조회

      const result = await regenerateTags('note-1')

      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['new-tag1', 'new-tag2'])
    })
  })

  describe('deleteTags', () => {
    it('should delete tags successfully', async () => {
      const mockDb = await import('@/lib/db/connection')
      const mockNote = { id: 'note-1', userId: 'test-user-id' }
      
      mockDb.db.select.mockResolvedValueOnce([mockNote]) // 노트 조회
      mockDb.db.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })

      const result = await deleteTags('note-1')

      expect(result.success).toBe(true)
      expect(result.noteId).toBe('note-1')
    })
  })
})
