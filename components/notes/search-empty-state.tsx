// components/notes/search-empty-state.tsx
// 검색 결과가 없을 때 표시되는 빈 상태 UI 컴포넌트
// 사용자에게 검색어 변경이나 다른 액션을 유도하는 친화적인 인터페이스 제공
// 관련 파일: app/notes/page.tsx, components/ui/button.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, RotateCcw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchEmptyStateProps {
  searchQuery: string
}

export function SearchEmptyState({ searchQuery }: SearchEmptyStateProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 검색어 초기화 함수
  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('search')
    params.set('page', '1')
    router.push(`/notes?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              <span className="font-medium">&quot;{searchQuery}&quot;</span>에 대한 검색 결과를 찾을 수 없습니다.
              <br />
              다른 검색어를 시도하거나 검색을 초기화해보세요.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleClearSearch}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              검색 초기화
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
