// __tests__/components/notes/tag-display.test.tsx
// 태그 표시 컴포넌트 테스트
// TagDisplay 컴포넌트의 렌더링과 상호작용에 대한 테스트
// 관련 파일: components/notes/tag-display.tsx, lib/ai/tag-actions.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TagDisplay } from '@/components/notes/tag-display'

// Mock tag actions
vi.mock('@/lib/ai/tag-actions', () => ({
  regenerateTags: vi.fn(),
  deleteTags: vi.fn()
}))

describe('TagDisplay', () => {
  const mockNoteId = 'test-note-id'
  const mockTags = ['react', 'typescript', 'testing']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={[]} 
        isLoading={true} 
      />
    )

    expect(screen.getByText('태그')).toBeInTheDocument()
    expect(screen.getByText('태그 생성 중...')).toBeInTheDocument()
  })

  it('should render empty state when no tags', () => {
    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={[]} 
        isLoading={false} 
      />
    )

    expect(screen.getByText('태그가 없습니다.')).toBeInTheDocument()
  })

  it('should render tags correctly', () => {
    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false} 
      />
    )

    expect(screen.getByText('태그 (3)')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.getByText('testing')).toBeInTheDocument()
  })

  it('should call regenerateTags when regenerate button is clicked', async () => {
    const { regenerateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(regenerateTags).mockResolvedValue({
      success: true,
      tags: ['new-tag1', 'new-tag2']
    })

    const mockOnRegenerate = vi.fn()

    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false}
        onRegenerate={mockOnRegenerate}
      />
    )

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(regenerateTags).toHaveBeenCalledWith(mockNoteId)
      expect(mockOnRegenerate).toHaveBeenCalled()
    })
  })

  it('should call deleteTags when delete button is clicked', async () => {
    const { deleteTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(deleteTags).mockResolvedValue({
      success: true,
      noteId: mockNoteId
    })

    const mockOnDelete = vi.fn()

    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(deleteTags).toHaveBeenCalledWith(mockNoteId)
      expect(mockOnDelete).toHaveBeenCalled()
    })
  })

  it('should disable regenerate button when regenerating', async () => {
    const { regenerateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(regenerateTags).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false}
      />
    )

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    fireEvent.click(regenerateButton)

    // Button should be disabled during regeneration
    expect(regenerateButton).toBeDisabled()
  })

  it('should handle regenerate error gracefully', async () => {
    const { regenerateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(regenerateTags).mockRejectedValue(new Error('Regenerate failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false}
      />
    )

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('태그 재생성 실패:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle delete error gracefully', async () => {
    const { deleteTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(deleteTags).mockRejectedValue(new Error('Delete failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TagDisplay 
        noteId={mockNoteId} 
        tags={mockTags} 
        isLoading={false}
      />
    )

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('태그 삭제 실패:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})
