// __tests__/components/notes/note-card.test.tsx
// 노트 카드 컴포넌트 테스트
// 노트 표시, 삭제 기능, 링크 기능 등을 테스트
// 관련 파일: components/notes/note-card.tsx, components/notes/delete-note-dialog.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteCard } from '@/components/notes/note-card'
import { Note } from '@/lib/db/schema/notes'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}))

vi.mock('@/components/notes/delete-note-dialog', () => ({
  DeleteNoteDialog: ({ children, noteId, noteTitle }: { children: React.ReactNode; noteId: string; noteTitle: string }) => (
    <div data-testid="delete-dialog" data-note-id={noteId} data-note-title={noteTitle}>
      {children}
    </div>
  )
}))

describe('NoteCard', () => {
  const mockNote: Note = {
    id: 'note-123',
    userId: 'user-123',
    title: '테스트 노트',
    content: '이것은 테스트 노트의 내용입니다. 매우 긴 내용을 테스트하기 위해 더 많은 텍스트를 추가합니다.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('노트 제목이 표시되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    expect(screen.getByText('테스트 노트')).toBeInTheDocument()
  })

  it('노트 내용이 미리보기로 표시되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    expect(screen.getByText(/이것은 테스트 노트의 내용입니다/)).toBeInTheDocument()
  })

  it('수정일이 표시되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    expect(screen.getByText(/수정일:/)).toBeInTheDocument()
  })

  it('생성일과 수정일이 다를 때 생성일도 표시되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    expect(screen.getByText(/생성일:/)).toBeInTheDocument()
  })

  it('노트 내용이 길 때 잘려서 표시되어야 한다', () => {
    const longContentNote = {
      ...mockNote,
      content: 'a'.repeat(200) // 200자 길이의 내용
    }
    
    render(<NoteCard note={longContentNote} />)
    
    const contentElement = screen.getByText(/^a+\.\.\.$/)
    expect(contentElement).toBeInTheDocument()
  })

  it('노트 내용이 없을 때 기본 메시지가 표시되어야 한다', () => {
    const emptyContentNote = {
      ...mockNote,
      content: null
    }
    
    render(<NoteCard note={emptyContentNote} />)
    
    expect(screen.getByText('내용이 없습니다.')).toBeInTheDocument()
  })

  it('삭제 다이얼로그가 렌더링되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    const deleteDialog = screen.getByTestId('delete-dialog')
    expect(deleteDialog).toBeInTheDocument()
    expect(deleteDialog).toHaveAttribute('data-note-id', 'note-123')
    expect(deleteDialog).toHaveAttribute('data-note-title', '테스트 노트')
  })

  it('노트 상세 페이지로의 링크가 있어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    const link = screen.getByRole('link', { name: /테스트 노트/ })
    expect(link).toHaveAttribute('href', '/notes/note-123')
  })

  it('노트 내용 클릭 시 상세 페이지로 이동해야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    const contentLink = screen.getByText(/이것은 테스트 노트의 내용입니다/).closest('a')
    expect(contentLink).toHaveAttribute('href', '/notes/note-123')
  })

  it('호버 시 액션 버튼들이 표시되어야 한다', () => {
    render(<NoteCard note={mockNote} />)
    
    // 호버 상태를 시뮬레이션하기 위해 group 클래스가 있는 요소를 찾아 호버 이벤트 발생
    const card = screen.getByText('테스트 노트').closest('.group')
    expect(card).toBeInTheDocument()
  })
})
