// __tests__/lib/notes/search-actions.test.ts
// 노트 검색 및 정렬 API 테스트
// getNotesWithSearchAndSort 함수의 다양한 시나리오를 테스트
// 관련 파일: lib/notes/actions.ts

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals'
import { getNotesWithSearchAndSort } from '@/lib/notes/actions'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock database connection
vi.mock('@/lib/db/connection', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([
                {
                  id: 'test-note-1',
                  userId: 'test-user-1',
                  title: '테스트 노트 1',
                  content: '테스트 내용 1',
                  createdAt: new Date('2024-01-01'),
                  updatedAt: new Date('2024-01-01')
                }
              ]))
            }))
          }))
        }))
      }))
    }))
  }
}))

// Mock count query
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(() => 'count(*)'),
  ilike: vi.fn(),
  and: vi.fn(),
  or: vi.fn()
}))

describe('getNotesWithSearchAndSort', () => {
  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('검색어 없이 노트 목록을 조회해야 한다', async () => {
    const result = await getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    expect(result).toHaveProperty('notes')
    expect(result).toHaveProperty('pagination')
    expect(result).toHaveProperty('searchQuery')
    expect(result.searchQuery).toBe('')
    expect(Array.isArray(result.notes)).toBe(true)
  })

  it('검색어로 노트를 필터링해야 한다', async () => {
    const result = await getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '테스트',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    expect(result.searchQuery).toBe('테스트')
    expect(result.notes).toHaveLength(1)
  })

  it('정렬 옵션에 따라 노트를 정렬해야 한다', async () => {
    const result = await getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '',
      sortBy: 'title',
      sortOrder: 'asc'
    })

    expect(result.notes).toBeDefined()
  })

  it('페이지네이션 정보를 올바르게 반환해야 한다', async () => {
    const result = await getNotesWithSearchAndSort({
      page: 2,
      limit: 5,
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    expect(result.pagination).toHaveProperty('currentPage', 2)
    expect(result.pagination).toHaveProperty('limit', 5)
    expect(result.pagination).toHaveProperty('totalPages')
    expect(result.pagination).toHaveProperty('totalCount')
    expect(result.pagination).toHaveProperty('hasNextPage')
    expect(result.pagination).toHaveProperty('hasPrevPage')
  })

  it('인증되지 않은 사용자에게 에러를 던져야 한다', async () => {
    ;(createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized')
        })
      }
    })

    await expect(getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })).rejects.toThrow('인증이 필요합니다.')
  })

  it('빈 검색어로 검색 시 모든 노트를 반환해야 한다', async () => {
    const result = await getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '   ', // 공백만 있는 검색어
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    expect(result.searchQuery).toBe('   ')
    expect(result.notes).toBeDefined()
  })

  it('검색 결과가 없을 때 빈 배열을 반환해야 한다', async () => {
    // Mock empty result
    vi.mocked(require('@/lib/db/connection').db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([]))
            }))
          }))
        }))
      }))
    } as any)

    const result = await getNotesWithSearchAndSort({
      page: 1,
      limit: 10,
      search: '존재하지않는검색어',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    expect(result.notes).toHaveLength(0)
    expect(result.pagination.totalCount).toBe(0)
  })
})
