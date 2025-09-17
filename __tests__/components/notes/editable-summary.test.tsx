// __tests__/components/notes/editable-summary.test.tsx
// 편집 가능한 요약 컴포넌트 테스트
// EditableSummary 컴포넌트의 편집 기능, 자동 저장, 유효성 검사 등을 테스트
// 관련 파일: components/notes/editable-summary.tsx, lib/ai/edit-actions.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditableSummary } from '@/components/notes/editable-summary'

// Mock 서버 액션
jest.mock('@/lib/ai/edit-actions', () => ({
  updateSummary: jest.fn()
}))

const mockUpdateSummary = require('@/lib/ai/edit-actions').updateSummary

describe('EditableSummary', () => {
  const defaultProps = {
    summary: '테스트 요약 내용입니다.',
    noteId: 'test-note-id',
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onEditStart: jest.fn(),
    onEditEnd: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('기본 표시', () => {
    it('요약 내용을 올바르게 표시한다', () => {
      render(<EditableSummary {...defaultProps} />)
      
      expect(screen.getByText('AI 요약')).toBeInTheDocument()
      expect(screen.getByText('테스트 요약 내용입니다.')).toBeInTheDocument()
    })

    it('편집 버튼을 표시한다', () => {
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })
  })

  describe('편집 모드 진입', () => {
    it('편집 버튼 클릭 시 편집 모드로 전환된다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText('요약 편집 중')).toBeInTheDocument()
      expect(screen.getByDisplayValue('테스트 요약 내용입니다.')).toBeInTheDocument()
      expect(defaultProps.onEditStart).toHaveBeenCalled()
    })

    it('편집 모드에서 취소 버튼이 표시된다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
    })
  })

  describe('편집 기능', () => {
    it('텍스트를 편집할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.clear(textarea)
      await user.type(textarea, '수정된 요약 내용')
      
      expect(textarea).toHaveValue('수정된 요약 내용')
    })

    it('글자 수 제한을 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} maxLength={100} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText(/19\/100/)).toBeInTheDocument()
    })

    it('글자 수 초과 시 경고를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} maxLength={10} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.clear(textarea)
      await user.type(textarea, '이것은 매우 긴 요약 내용입니다')
      
      expect(screen.getByText(/글자 수 초과/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /저장/i })).toBeDisabled()
    })
  })

  describe('키보드 단축키', () => {
    it('Escape 키로 편집을 취소할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.type(textarea, '{Escape}')
      
      expect(screen.getByText('AI 요약')).toBeInTheDocument()
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('Ctrl+Enter로 저장할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.type(textarea, '{Control>}{Enter}{/Control}')
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('테스트 요약 내용입니다.')
    })
  })

  describe('자동 저장', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('2초 후 자동으로 저장된다', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.type(textarea, ' 수정')
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('테스트 요약 내용입니다. 수정')
      })
    })
  })

  describe('저장 기능', () => {
    it('저장 버튼 클릭 시 저장된다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const saveButton = screen.getByRole('button', { name: /저장/i })
      await user.click(saveButton)
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('테스트 요약 내용입니다.')
    })

    it('빈 내용으로 저장 시 에러를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByDisplayValue('테스트 요약 내용입니다.')
      await user.clear(textarea)
      
      const saveButton = screen.getByRole('button', { name: /저장/i })
      await user.click(saveButton)
      
      expect(screen.getByText('요약 내용을 입력해주세요.')).toBeInTheDocument()
    })
  })

  describe('취소 기능', () => {
    it('취소 버튼 클릭 시 편집이 취소된다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const cancelButton = screen.getByRole('button', { name: /취소/i })
      await user.click(cancelButton)
      
      expect(screen.getByText('AI 요약')).toBeInTheDocument()
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('접근성', () => {
    it('편집 모드에서 적절한 ARIA 레이블을 가진다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('placeholder', '요약 내용을 입력하세요...')
    })

    it('키보드 단축키 안내를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableSummary {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText('Ctrl+Enter로 저장, Esc로 취소')).toBeInTheDocument()
    })
  })
})
