// __tests__/lib/ai/edit-actions.test.ts
// 편집 액션 테스트
// updateSummary, updateTags 등 편집 관련 서버 액션들을 테스트
// 관련 파일: lib/ai/edit-actions.ts, lib/db/connection.ts, lib/supabase/server.ts

import { updateSummary, updateTags, deleteSummary, deleteTags } from '@/lib/ai/edit-actions'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    transaction: jest.fn()
  }
}))

const mockCreateClient = require('@/lib/supabase/server').createClient
const mockDb = require('@/lib/db/connection').db

describe('edit-actions', () => {
  const mockUser = { id: 'user-123' }
  const mockNote = { id: 'note-123', userId: 'user-123' }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock setup
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    })

    mockDb.select.mockResolvedValue([mockNote])
  })

  describe('updateSummary', () => {
    it('성공적으로 요약을 업데이트한다', async () => {
      const result = await updateSummary('note-123', '새로운 요약 내용')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('인증되지 않은 사용자에게 에러를 반환한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized')
          })
        }
      })

      const result = await updateSummary('note-123', '새로운 요약 내용')

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('존재하지 않는 노트에 대해 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([])

      const result = await updateSummary('note-123', '새로운 요약 내용')

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('권한이 없는 사용자에게 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([{ id: 'note-123', userId: 'other-user' }])

      const result = await updateSummary('note-123', '새로운 요약 내용')

      expect(result.success).toBe(false)
      expect(result.error).toBe('이 노트를 수정할 권한이 없습니다.')
    })

    it('빈 요약 내용에 대해 에러를 반환한다', async () => {
      const result = await updateSummary('note-123', '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('요약 내용을 입력해주세요.')
    })

    it('긴 요약 내용에 대해 에러를 반환한다', async () => {
      const longContent = 'a'.repeat(501)
      const result = await updateSummary('note-123', longContent)

      expect(result.success).toBe(false)
      expect(result.error).toBe('요약은 최대 500자까지 입력할 수 있습니다.')
    })
  })

  describe('updateTags', () => {
    it('성공적으로 태그를 업데이트한다', async () => {
      mockDb.transaction.mockImplementation(async (callback) => {
        await callback(mockDb)
      })

      const result = await updateTags('note-123', ['태그1', '태그2', '태그3'])

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('인증되지 않은 사용자에게 에러를 반환한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized')
          })
        }
      })

      const result = await updateTags('note-123', ['태그1', '태그2'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('존재하지 않는 노트에 대해 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([])

      const result = await updateTags('note-123', ['태그1', '태그2'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })

    it('권한이 없는 사용자에게 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([{ id: 'note-123', userId: 'other-user' }])

      const result = await updateTags('note-123', ['태그1', '태그2'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('이 노트를 수정할 권한이 없습니다.')
    })

    it('배열이 아닌 태그에 대해 에러를 반환한다', async () => {
      const result = await updateTags('note-123', 'invalid' as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('태그는 배열 형태여야 합니다.')
    })

    it('너무 많은 태그에 대해 에러를 반환한다', async () => {
      const manyTags = Array.from({ length: 7 }, (_, i) => `태그${i + 1}`)
      const result = await updateTags('note-123', manyTags)

      expect(result.success).toBe(false)
      expect(result.error).toBe('태그는 최대 6개까지 입력할 수 있습니다.')
    })

    it('중복 태그를 제거하고 정리한다', async () => {
      mockDb.transaction.mockImplementation(async (callback) => {
        await callback(mockDb)
      })

      const result = await updateTags('note-123', ['태그1', '태그1', '  태그2  ', '', '태그3'])

      expect(result.success).toBe(true)
      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          values: [
            { noteId: 'note-123', tag: '태그1' },
            { noteId: 'note-123', tag: '태그2' },
            { noteId: 'note-123', tag: '태그3' }
          ]
        })
      )
    })
  })

  describe('deleteSummary', () => {
    it('성공적으로 요약을 삭제한다', async () => {
      const result = await deleteSummary('note-123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('인증되지 않은 사용자에게 에러를 반환한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized')
          })
        }
      })

      const result = await deleteSummary('note-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('존재하지 않는 노트에 대해 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([])

      const result = await deleteSummary('note-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })
  })

  describe('deleteTags', () => {
    it('성공적으로 태그를 삭제한다', async () => {
      const result = await deleteTags('note-123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('인증되지 않은 사용자에게 에러를 반환한다', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized')
          })
        }
      })

      const result = await deleteTags('note-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다.')
    })

    it('존재하지 않는 노트에 대해 에러를 반환한다', async () => {
      mockDb.select.mockResolvedValue([])

      const result = await deleteTags('note-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('노트를 찾을 수 없습니다.')
    })
  })

  describe('에러 처리', () => {
    it('데이터베이스 오류 시 적절한 에러 메시지를 반환한다', async () => {
      mockDb.select.mockRejectedValue(new Error('Database error'))

      const result = await updateSummary('note-123', '새로운 요약 내용')

      expect(result.success).toBe(false)
      expect(result.error).toBe('요약 저장에 실패했습니다. 다시 시도해주세요.')
    })

    it('태그 업데이트 중 데이터베이스 오류 시 적절한 에러 메시지를 반환한다', async () => {
      mockDb.transaction.mockRejectedValue(new Error('Transaction error'))

      const result = await updateTags('note-123', ['태그1', '태그2'])

      expect(result.success).toBe(false)
      expect(result.error).toBe('태그 저장에 실패했습니다. 다시 시도해주세요.')
    })
  })
})
