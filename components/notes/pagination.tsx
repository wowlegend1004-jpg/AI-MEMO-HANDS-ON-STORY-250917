// components/notes/pagination.tsx
// 노트 목록 페이지네이션 컴포넌트
// 페이지 이동, 이전/다음 버튼, 페이지 번호 표시 기능을 제공
// 관련 파일: app/notes/page.tsx, lib/notes/actions.ts

'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  hasNextPage, 
  hasPrevPage 
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/notes?${params.toString()}`)
  }

  const handlePrevPage = () => {
    if (hasPrevPage) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1)
    }
  }

  // 페이지 번호 생성 로직
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 현재 페이지를 중심으로 페이지 번호 생성
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, currentPage + 2)
      
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {/* 이전 페이지 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevPage}
        disabled={!hasPrevPage}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </Button>

      {/* 페이지 번호들 */}
      <div className="flex items-center space-x-1">
        {generatePageNumbers().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <div className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="h-9 w-9"
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 다음 페이지 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={!hasNextPage}
        className="flex items-center gap-1"
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
