// __tests__/components/notes/search-input.test.tsx
// 검색 입력 컴포넌트 테스트
// 검색 입력, 디바운스, 초기화 기능을 테스트
// 관련 파일: components/notes/search-input.tsx

import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchInput } from '@/components/notes/search-input'

// Mock Next.js router
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => mockSearchParams
}))

// Mock timers for debounce testing
vi.useFakeTimers()

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.clear()
  })

  it('검색 입력 필드가 렌더링되어야 한다', () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('노트 제목이나 내용으로 검색...')
    expect(input).toBeInTheDocument()
  })

  it('현재 검색어가 입력 필드에 표시되어야 한다', () => {
    render(<SearchInput currentSearch="테스트 검색어" />)
    
    const input = screen.getByDisplayValue('테스트 검색어')
    expect(input).toBeInTheDocument()
  })

  it('검색어 입력 시 디바운스가 적용되어야 한다', async () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('노트 제목이나 내용으로 검색...')
    
    fireEvent.change(input, { target: { value: '테스트' } })
    
    // 디바운스 시간 전에는 URL이 업데이트되지 않아야 함
    expect(mockPush).not.toHaveBeenCalled()
    
    // 디바운스 시간 후에 URL이 업데이트되어야 함
    vi.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/notes?search=테스트&page=1')
    })
  })

  it('Enter 키 입력 시 즉시 검색해야 한다', async () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('노트 제목이나 내용으로 검색...')
    
    fireEvent.change(input, { target: { value: '즉시 검색' } })
    fireEvent.keyPress(input, { key: 'Enter' })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/notes?search=즉시 검색&page=1')
    })
  })

  it('검색어가 있을 때 X 버튼이 표시되어야 한다', () => {
    render(<SearchInput currentSearch="테스트" />)
    
    const clearButton = screen.getByLabelText('검색어 지우기')
    expect(clearButton).toBeInTheDocument()
  })

  it('X 버튼 클릭 시 검색어가 초기화되어야 한다', async () => {
    render(<SearchInput currentSearch="테스트" />)
    
    const clearButton = screen.getByLabelText('검색어 지우기')
    fireEvent.click(clearButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/notes?page=1')
    })
  })

  it('검색어가 없을 때 X 버튼이 표시되지 않아야 한다', () => {
    render(<SearchInput currentSearch="" />)
    
    const clearButton = screen.queryByLabelText('검색어 지우기')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('검색 중일 때 로딩 상태가 표시되어야 한다', () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('노트 제목이나 내용으로 검색...')
    
    fireEvent.change(input, { target: { value: '검색 중' } })
    
    expect(screen.getByText('검색 중...')).toBeInTheDocument()
  })

  it('커스텀 placeholder가 적용되어야 한다', () => {
    render(<SearchInput placeholder="커스텀 검색어" />)
    
    const input = screen.getByPlaceholderText('커스텀 검색어')
    expect(input).toBeInTheDocument()
  })

  it('검색어 변경 시 입력 필드가 비활성화되어야 한다', () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('노트 제목이나 내용으로 검색...')
    
    fireEvent.change(input, { target: { value: '검색 중' } })
    
    expect(input).toBeDisabled()
  })
})
