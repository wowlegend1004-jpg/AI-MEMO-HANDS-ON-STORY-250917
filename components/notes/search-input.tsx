// components/notes/search-input.tsx
// 노트 검색 입력 필드 컴포넌트
// 실시간 검색 기능과 디바운스를 적용한 검색 입력 인터페이스 제공
// 관련 파일: app/notes/page.tsx, components/ui/input.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  currentSearch?: string
  placeholder?: string
}

export function SearchInput({ 
  currentSearch = '', 
  placeholder = '노트 제목이나 내용으로 검색...' 
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(currentSearch)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (value: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setIsSearching(false)
          updateURL(value)
        }, 300) // 300ms 디바운스
      }
    })(),
    []
  )

  // URL 업데이트 함수
  const updateURL = (searchQuery: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }
    
    // 검색 시 첫 페이지로 이동
    params.set('page', '1')
    
    router.push(`/notes?${params.toString()}`)
  }

  // 검색어 변경 핸들러
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setIsSearching(true)
    debouncedSearch(value)
  }

  // 검색어 초기화 핸들러
  const handleClearSearch = () => {
    setSearchValue('')
    setIsSearching(false)
    updateURL('')
  }

  // Enter 키 핸들러 (즉시 검색)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsSearching(false)
      updateURL(searchValue)
    }
  }

  // 컴포넌트 마운트 시 현재 검색어 설정
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10"
          disabled={isSearching}
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="검색어 지우기"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* 검색 중 표시 */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
          검색 중...
        </div>
      )}
    </div>
  )
}
