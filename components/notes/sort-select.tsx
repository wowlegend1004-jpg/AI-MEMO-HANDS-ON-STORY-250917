// components/notes/sort-select.tsx
// 노트 목록 정렬 옵션 선택 컴포넌트
// 최신순, 오래된순, 제목순 A-Z, 제목순 Z-A 정렬 옵션을 제공
// 관련 파일: app/notes/page.tsx, components/ui/select.tsx

'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'

const sortOptions = [
  { value: 'created_at_desc', label: '최신순' },
  { value: 'created_at_asc', label: '오래된순' },
  { value: 'title_asc', label: '제목순 A-Z' },
  { value: 'title_desc', label: '제목순 Z-A' },
  { value: 'updated_at_desc', label: '수정일 최신순' },
  { value: 'updated_at_asc', label: '수정일 오래된순' }
]

interface SortSelectProps {
  currentSort: string
}

export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    params.set('page', '1') // 정렬 변경 시 첫 페이지로 이동
    router.push(`/notes?${params.toString()}`)
  }

  const currentOption = sortOptions.find(option => option.value === currentSort)

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        정렬:
      </label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]" id="sort-select">
          <SelectValue placeholder="정렬 선택">
            {currentOption?.label || '정렬 선택'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
