// app/notes/page.tsx
// 노트 목록 페이지 (페이지네이션 및 정렬 기능 포함)
// 사용자가 작성한 노트를 페이지네이션과 정렬 기능으로 효율적으로 탐색할 수 있는 페이지
// 관련 파일: lib/notes/actions.ts, components/notes/note-card.tsx, components/notes/pagination.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Home, ArrowLeft } from 'lucide-react'
import { getNotesWithSearchAndSort } from '@/lib/notes/actions'
import { NoteCard } from '@/components/notes/note-card'
import { Pagination } from '@/components/notes/pagination'
import { SortSelect } from '@/components/notes/sort-select'
import { SearchInput } from '@/components/notes/search-input'
import { EmptyState } from '@/components/notes/empty-state'
import { SearchEmptyState } from '@/components/notes/search-empty-state'
import { LoadingSkeleton } from '@/components/notes/loading-skeleton'
import { Suspense } from 'react'

interface NotesPageProps {
  searchParams: Promise<{
    page?: string
    sort?: string
    search?: string
  }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  // URL 파라미터 파싱
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const sortParam = resolvedSearchParams.sort || 'created_at_desc'
  const searchQuery = resolvedSearchParams.search || ''
  
  // 정렬 옵션 파싱
  const [sortBy, sortOrder] = sortParam.split('_')
  const validSortBy = ['created_at', 'updated_at', 'title'].includes(sortBy) ? sortBy : 'created_at'
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc'

  // 노트 목록 조회 (검색 및 정렬 포함)
  let notesData
  try {
    notesData = await getNotesWithSearchAndSort({
      page,
      limit: 10,
      search: searchQuery,
      sortBy: validSortBy as 'created_at' | 'updated_at' | 'title',
      sortOrder: validSortOrder as 'asc' | 'desc'
    })
    
    // 디버깅: 노트 목록 로깅
    console.log('노트 목록 조회 결과:', {
      notesCount: notesData.notes.length,
      noteIds: notesData.notes.map(note => note.id),
      searchQuery: notesData.searchQuery,
      pagination: notesData.pagination
    })
  } catch (error) {
    console.error('노트 조회 오류:', error)
    // 에러 발생 시 빈 데이터로 처리
    notesData = {
      notes: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
      },
      searchQuery: searchQuery
    }
  }

  const { notes, pagination, searchQuery: currentSearchQuery } = notesData

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* 네비게이션 바 */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            메인 화면으로
          </Button>
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            내 노트
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {currentSearchQuery 
              ? `"${currentSearchQuery}" 검색 결과: ${pagination.totalCount}개`
              : pagination.totalCount > 0 
                ? `총 ${pagination.totalCount}개의 노트` 
                : '작성한 모든 노트를 확인하고 관리하세요.'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              대시보드
            </Button>
          </Link>
          <Link href="/notes/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새 노트 작성
            </Button>
          </Link>
        </div>
      </div>

      {/* 검색 및 정렬 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput currentSearch={currentSearchQuery} />
        </div>
        {pagination.totalCount > 0 && (
          <div className="flex items-center gap-2">
            <SortSelect currentSort={sortParam} />
          </div>
        )}
      </div>

      {/* 페이지네이션 정보 */}
      {pagination.totalCount > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.currentPage} / {pagination.totalPages} 페이지
          </div>
        </div>
      )}

      {/* 노트 목록 */}
      {pagination.totalCount === 0 ? (
        currentSearchQuery ? (
          <SearchEmptyState searchQuery={currentSearchQuery} />
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <Suspense fallback={<LoadingSkeleton />}>
            <div className="grid gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </Suspense>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          )}
        </>
      )}
    </div>
  )
}
