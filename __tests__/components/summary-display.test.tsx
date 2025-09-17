// __tests__/components/summary-display.test.tsx
// 요약 표시 컴포넌트 테스트
// SummaryDisplay 컴포넌트의 렌더링과 상호작용을 테스트
// 관련 파일: components/notes/summary-display.tsx

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SummaryDisplay } from '@/components/notes/summary-display'

// Mock server actions
jest.mock('@/lib/ai/summary-actions', () => ({
  regenerateSummary: jest.fn(),
  deleteSummary: jest.fn()
}))

describe('SummaryDisplay', () => {
  const mockProps = {
    noteId: 'test-note-id',
    onSummaryChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render loading state', () => {
    render(<SummaryDisplay {...mockProps} isLoading={true} />)
    
    expect(screen.getByText('AI 요약')).toBeInTheDocument()
    expect(screen.getByText('요약을 생성하고 있습니다...')).toBeInTheDocument()
  })

  test('should render summary with bullet points', () => {
    const summary = '• 첫 번째 요약 포인트\n• 두 번째 요약 포인트\n• 세 번째 요약 포인트'
    
    render(<SummaryDisplay {...mockProps} summary={summary} />)
    
    expect(screen.getByText('AI 요약')).toBeInTheDocument()
    expect(screen.getByText('첫 번째 요약 포인트')).toBeInTheDocument()
    expect(screen.getByText('두 번째 요약 포인트')).toBeInTheDocument()
    expect(screen.getByText('세 번째 요약 포인트')).toBeInTheDocument()
  })

  test('should not render when no summary provided', () => {
    const { container } = render(<SummaryDisplay {...mockProps} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('should handle regenerate button click', async () => {
    const { regenerateSummary } = require('@/lib/ai/summary-actions')
    regenerateSummary.mockResolvedValue({
      success: true,
      summary: '• 새로운 요약'
    })

    const summary = '• 기존 요약'
    render(<SummaryDisplay {...mockProps} summary={summary} />)
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(regenerateSummary).toHaveBeenCalledWith('test-note-id')
    })
  })

  test('should handle delete button click', async () => {
    const { deleteSummary } = require('@/lib/ai/summary-actions')
    deleteSummary.mockResolvedValue({
      success: true
    })

    const summary = '• 기존 요약'
    render(<SummaryDisplay {...mockProps} summary={summary} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(deleteSummary).toHaveBeenCalledWith('test-note-id')
    })
  })

  test('should display error message when regenerate fails', async () => {
    const { regenerateSummary } = require('@/lib/ai/summary-actions')
    regenerateSummary.mockResolvedValue({
      success: false,
      error: '재생성 실패'
    })

    const summary = '• 기존 요약'
    render(<SummaryDisplay {...mockProps} summary={summary} />)
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    fireEvent.click(regenerateButton)

    await waitFor(() => {
      expect(screen.getByText('재생성 실패')).toBeInTheDocument()
    })
  })

  test('should disable buttons during operations', async () => {
    const { regenerateSummary } = require('@/lib/ai/summary-actions')
    regenerateSummary.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const summary = '• 기존 요약'
    render(<SummaryDisplay {...mockProps} summary={summary} />)
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i })
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    
    fireEvent.click(regenerateButton)

    expect(regenerateButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
  })
})
