// __tests__/lib/notes/actions.test.ts
// 노트 관련 Server Actions 테스트
// 노트 생성, 조회, 수정, 삭제 기능을 테스트
// 관련 파일: lib/notes/actions.ts, lib/db/schema/notes.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { deleteNote } from '@/lib/notes/actions'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}))

vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [])
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [])
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [])
      }))
    }))
  }
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('노트 삭제 API', () => {
  const mockUser = { id: 'user-123' }
  const mockNote = {
    id: 'note-123',
    userId: 'user-123',
    title: '테스트 노트',
    content: '테스트 내용',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('권한이 있는 노트를 성공적으로 삭제해야 한다', async () => {
    // Mock setup
    const { createClient } = await import('@/lib/supabase/server')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

    const { db } = await import('@/lib/db/connection')
    const mockSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [mockNote])
        }))
      }))
    }))
    const mockDelete = vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [mockNote])
      }))
    }))
    vi.mocked(db).select = mockSelect
    vi.mocked(db).delete = mockDelete

    // Test
    const result = await deleteNote('note-123')

    expect(result).toEqual(mockNote)
    expect(mockSelect).toHaveBeenCalled()
    expect(mockDelete).toHaveBeenCalled()
  })

  it('존재하지 않는 노트 삭제 시 NOT_FOUND 에러를 던져야 한다', async () => {
    // Mock setup
    const { createClient } = await import('@/lib/supabase/server')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

    const { db } = await import('@/lib/db/connection')
    const mockSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []) // 빈 배열 반환 (노트 없음)
        }))
      }))
    }))
    vi.mocked(db).select = mockSelect

    // Test
    await expect(deleteNote('non-existent-note')).rejects.toThrow('NOT_FOUND')
  })

  it('권한이 없는 노트 삭제 시 FORBIDDEN 에러를 던져야 한다', async () => {
    // Mock setup
    const { createClient } = await import('@/lib/supabase/server')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

    const otherUserNote = { ...mockNote, userId: 'other-user-123' }
    const { db } = await import('@/lib/db/connection')
    const mockSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [otherUserNote])
        }))
      }))
    }))
    vi.mocked(db).select = mockSelect

    // Test
    await expect(deleteNote('note-123')).rejects.toThrow('FORBIDDEN')
  })

  it('인증되지 않은 사용자가 노트 삭제 시 에러를 던져야 한다', async () => {
    // Mock setup
    const { createClient } = await import('@/lib/supabase/server')
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized')
        })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)

    // Test
    await expect(deleteNote('note-123')).rejects.toThrow('인증이 필요합니다.')
  })
})
