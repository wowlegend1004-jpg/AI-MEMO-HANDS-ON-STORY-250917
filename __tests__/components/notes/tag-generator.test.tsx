// __tests__/components/notes/tag-generator.test.tsx
// 태그 생성기 컴포넌트 테스트
// TagGenerator 컴포넌트의 렌더링과 상호작용에 대한 테스트
// 관련 파일: components/notes/tag-generator.tsx, lib/ai/tag-actions.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TagGenerator } from '@/components/notes/tag-generator'

// Mock tag actions
vi.mock('@/lib/ai/tag-actions', () => ({
  generateTags: vi.fn()
}))

describe('TagGenerator', () => {
  const mockNoteId = 'test-note-id'
  const mockContent = 'This is a test note with enough content to generate tags. It should be at least 100 characters long to pass validation and generate meaningful tags.'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render generate button', () => {
    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
      />
    )

    expect(screen.getByRole('button', { name: /AI 태그 생성/i })).toBeInTheDocument()
  })

  it('should disable button for content shorter than 100 characters', () => {
    const shortContent = 'Short content'
    
    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={shortContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    expect(button).toBeDisabled()
    expect(screen.getByText('태그 생성을 위해서는 최소 100자 이상의 내용이 필요합니다.')).toBeInTheDocument()
  })

  it('should disable button when disabled prop is true', () => {
    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
        disabled={true}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    expect(button).toBeDisabled()
  })

  it('should call generateTags when button is clicked', async () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    const mockTags = ['tag1', 'tag2', 'tag3']
    vi.mocked(generateTags).mockResolvedValue({
      success: true,
      tags: mockTags
    })

    const mockOnTagsGenerated = vi.fn()

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
        onTagsGenerated={mockOnTagsGenerated}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(generateTags).toHaveBeenCalledWith({
        noteId: mockNoteId,
        content: mockContent,
        forceRegenerate: false
      })
      expect(mockOnTagsGenerated).toHaveBeenCalledWith(mockTags)
    })
  })

  it('should show loading state during generation', async () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(generateTags).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    expect(screen.getByText('태그 생성 중...')).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('should display error message when generation fails', async () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(generateTags).mockResolvedValue({
      success: false,
      error: 'Generation failed'
    })

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Generation failed')).toBeInTheDocument()
    })
  })

  it('should display error message when generation throws error', async () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    vi.mocked(generateTags).mockRejectedValue(new Error('Network error'))

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('태그 생성 중 오류가 발생했습니다.')).toBeInTheDocument()
    })
  })

  it('should not call generateTags when button is disabled', () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
        disabled={true}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    expect(generateTags).not.toHaveBeenCalled()
  })

  it('should not call generateTags when content is too short', () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    const shortContent = 'Short content'

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={shortContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    fireEvent.click(button)

    expect(generateTags).not.toHaveBeenCalled()
  })

  it('should reset error state when button is clicked again', async () => {
    const { generateTags } = await import('@/lib/ai/tag-actions')
    
    // First call fails
    vi.mocked(generateTags).mockResolvedValueOnce({
      success: false,
      error: 'First error'
    })
    
    // Second call succeeds
    vi.mocked(generateTags).mockResolvedValueOnce({
      success: true,
      tags: ['tag1', 'tag2']
    })

    render(
      <TagGenerator 
        noteId={mockNoteId} 
        content={mockContent}
      />
    )

    const button = screen.getByRole('button', { name: /AI 태그 생성/i })
    
    // First click - should show error
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second click - should clear error and show loading
    fireEvent.click(button)
    expect(screen.getByText('태그 생성 중...')).toBeInTheDocument()
    expect(screen.queryByText('First error')).not.toBeInTheDocument()
  })
})
