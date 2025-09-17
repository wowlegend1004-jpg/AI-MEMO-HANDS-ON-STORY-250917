// __tests__/components/notes/search-empty-state.test.tsx
// 검색 결과 없음 상태 컴포넌트 테스트
// 검색 결과가 없을 때 표시되는 UI와 액션을 테스트
// 관련 파일: components/notes/search-empty-state.tsx

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchEmptyState } from '@/components/notes/search-empty-state'

// Mock Next.js router
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => mockSearchParams
}))

describe('SearchEmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.clear()
  })

  it('검색 결과 없음 메시지가 표시되어야 한다', () => {
    render(<SearchEmptyState searchQuery="존재하지않는검색어" />)
    
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('검색어가 메시지에 표시되어야 한다', () => {
    const searchQuery = '테스트 검색어'
    render(<SearchEmptyState searchQuery={searchQuery} />)
    
    expect(screen.getByText(`"${searchQuery}"`)).toBeInTheDocument()
  })

  it('검색 초기화 버튼이 표시되어야 한다', () => {
    render(<SearchEmptyState searchQuery="테스트" />)
    
    const clearButton = screen.getByText('검색 초기화')
    expect(clearButton).toBeInTheDocument()
  })

  it('검색 초기화 버튼 클릭 시 URL이 업데이트되어야 한다', () => {
    render(<SearchEmptyState searchQuery="테스트" />)
    
    const clearButton = screen.getByText('검색 초기화')
    fireEvent.click(clearButton)
    
    expect(mockPush).toHaveBeenCalledWith('/notes?page=1')
  })

  it('검색 아이콘이 표시되어야 한다', () => {
    render(<SearchEmptyState searchQuery="테스트" />)
    
    // Search 아이콘은 lucide-react에서 제공하므로 클래스명으로 확인
    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
  })

  it('긴 검색어도 올바르게 표시되어야 한다', () => {
    const longSearchQuery = '매우 긴 검색어입니다 이것은 테스트용 검색어입니다'
    render(<SearchEmptyState searchQuery={longSearchQuery} />)
    
    expect(screen.getByText(`"${longSearchQuery}"`)).toBeInTheDocument()
  })

  it('빈 검색어도 처리되어야 한다', () => {
    render(<SearchEmptyState searchQuery="" />)
    
    expect(screen.getByText('""')).toBeInTheDocument()
  })

  it('검색 초기화 버튼이 접근 가능해야 한다', () => {
    render(<SearchEmptyState searchQuery="테스트" />)
    
    const clearButton = screen.getByRole('button', { name: /검색 초기화/i })
    expect(clearButton).toBeInTheDocument()
  })
})
