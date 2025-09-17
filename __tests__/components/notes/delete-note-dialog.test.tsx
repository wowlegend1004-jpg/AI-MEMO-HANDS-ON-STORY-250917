// __tests__/components/notes/delete-note-dialog.test.tsx
// 노트 삭제 확인 다이얼로그 컴포넌트 테스트
// 다이얼로그 표시, 삭제 확인, 에러 처리 등을 테스트
// 관련 파일: components/notes/delete-note-dialog.tsx, lib/notes/actions.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteNoteDialog } from '@/components/notes/delete-note-dialog'

// Mock dependencies
vi.mock('@/lib/notes/actions', () => ({
  deleteNote: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}))

describe('DeleteNoteDialog', () => {
  const mockProps = {
    noteId: 'note-123',
    noteTitle: '테스트 노트',
    onDeleteSuccess: vi.fn(),
    children: <button>삭제 버튼</button>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('다이얼로그가 닫힌 상태로 렌더링되어야 한다', () => {
    render(<DeleteNoteDialog {...mockProps} />)
    
    expect(screen.getByText('삭제 버튼')).toBeInTheDocument()
    expect(screen.queryByText('노트 삭제 확인')).not.toBeInTheDocument()
  })

  it('트리거 버튼 클릭 시 다이얼로그가 열려야 한다', async () => {
    render(<DeleteNoteDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('노트 삭제 확인')).toBeInTheDocument()
    })
  })

  it('다이얼로그에 노트 제목이 표시되어야 한다', async () => {
    render(<DeleteNoteDialog {...mockProps} />)
    
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('"테스트 노트" 노트를 삭제하시겠습니까?')).toBeInTheDocument()
    })
  })

  it('취소 버튼 클릭 시 다이얼로그가 닫혀야 한다', async () => {
    render(<DeleteNoteDialog {...mockProps} />)
    
    // 다이얼로그 열기
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('노트 삭제 확인')).toBeInTheDocument()
    })
    
    // 취소 버튼 클릭
    const cancelButton = screen.getByText('취소')
    fireEvent.click(cancelButton)
    
    await waitFor(() => {
      expect(screen.queryByText('노트 삭제 확인')).not.toBeInTheDocument()
    })
  })

  it('삭제 성공 시 onDeleteSuccess 콜백이 호출되어야 한다', async () => {
    const { deleteNote } = await import('@/lib/notes/actions')
    vi.mocked(deleteNote).mockResolvedValue({} as unknown as ReturnType<typeof deleteNote>)
    
    render(<DeleteNoteDialog {...mockProps} />)
    
    // 다이얼로그 열기
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('노트 삭제 확인')).toBeInTheDocument()
    })
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByText('삭제')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith('note-123')
      expect(mockProps.onDeleteSuccess).toHaveBeenCalled()
    })
  })

  it('삭제 실패 시 에러 메시지가 표시되어야 한다', async () => {
    const { deleteNote } = await import('@/lib/notes/actions')
    vi.mocked(deleteNote).mockRejectedValue(new Error('NOT_FOUND'))
    
    render(<DeleteNoteDialog {...mockProps} />)
    
    // 다이얼로그 열기
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('노트 삭제 확인')).toBeInTheDocument()
    })
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByText('삭제')
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('삭제할 노트를 찾을 수 없습니다.')).toBeInTheDocument()
    })
  })

  it('삭제 중 로딩 상태가 표시되어야 한다', async () => {
    const { deleteNote } = await import('@/lib/notes/actions')
    vi.mocked(deleteNote).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<DeleteNoteDialog {...mockProps} />)
    
    // 다이얼로그 열기
    const triggerButton = screen.getByText('삭제 버튼')
    fireEvent.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('노트 삭제 확인')).toBeInTheDocument()
    })
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByText('삭제')
    fireEvent.click(deleteButton)
    
    // 로딩 상태 확인
    expect(screen.getByText('삭제 중...')).toBeInTheDocument()
    expect(deleteButton).toBeDisabled()
  })
})
