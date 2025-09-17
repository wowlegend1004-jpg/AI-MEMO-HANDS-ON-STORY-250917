// __tests__/components/notes/editable-tags.test.tsx
// 편집 가능한 태그 컴포넌트 테스트
// EditableTags 컴포넌트의 태그 추가/삭제/수정 기능을 테스트
// 관련 파일: components/notes/editable-tags.tsx, lib/ai/edit-actions.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditableTags } from '@/components/notes/editable-tags'

// Mock 서버 액션
jest.mock('@/lib/ai/edit-actions', () => ({
  updateTags: jest.fn()
}))

const mockUpdateTags = require('@/lib/ai/edit-actions').updateTags

describe('EditableTags', () => {
  const defaultProps = {
    tags: ['태그1', '태그2', '태그3'],
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
    it('태그 목록을 올바르게 표시한다', () => {
      render(<EditableTags {...defaultProps} />)
      
      expect(screen.getByText('AI 태그')).toBeInTheDocument()
      expect(screen.getByText('태그1')).toBeInTheDocument()
      expect(screen.getByText('태그2')).toBeInTheDocument()
      expect(screen.getByText('태그3')).toBeInTheDocument()
    })

    it('편집 버튼을 표시한다', () => {
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })

    it('태그가 없을 때 적절한 메시지를 표시한다', () => {
      render(<EditableTags {...defaultProps} tags={[]} />)
      
      expect(screen.getByText('태그가 없습니다.')).toBeInTheDocument()
    })
  })

  describe('편집 모드 진입', () => {
    it('편집 버튼 클릭 시 편집 모드로 전환된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText('태그 편집 중')).toBeInTheDocument()
      expect(defaultProps.onEditStart).toHaveBeenCalled()
    })

    it('편집 모드에서 새 태그 입력 필드가 표시된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByPlaceholderText('새 태그 입력...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /plus/i })).toBeInTheDocument()
    })
  })

  describe('태그 추가', () => {
    it('새 태그를 추가할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '새태그')
      
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      expect(screen.getByText('새태그')).toBeInTheDocument()
    })

    it('Enter 키로 태그를 추가할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '새태그{Enter}')
      
      expect(screen.getByText('새태그')).toBeInTheDocument()
    })

    it('중복 태그 추가 시 에러를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '태그1')
      
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      expect(screen.getByText('이미 존재하는 태그입니다.')).toBeInTheDocument()
    })

    it('최대 태그 개수 초과 시 에러를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} maxTags={3} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '새태그')
      
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      expect(screen.getByText('태그는 최대 3개까지 입력할 수 있습니다.')).toBeInTheDocument()
    })
  })

  describe('태그 삭제', () => {
    it('태그의 X 버튼 클릭으로 삭제할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const deleteButtons = screen.getAllByRole('button', { name: /x/i })
      await user.click(deleteButtons[0]) // 첫 번째 태그 삭제
      
      expect(screen.queryByText('태그1')).not.toBeInTheDocument()
      expect(screen.getByText('태그2')).toBeInTheDocument()
      expect(screen.getByText('태그3')).toBeInTheDocument()
    })
  })

  describe('태그 수정', () => {
    it('태그 클릭 시 수정 모드로 전환된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const tag1 = screen.getByText('태그1')
      await user.click(tag1)
      
      const input = screen.getByDisplayValue('태그1')
      expect(input).toBeInTheDocument()
    })

    it('태그 수정 후 Enter로 저장된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const tag1 = screen.getByText('태그1')
      await user.click(tag1)
      
      const input = screen.getByDisplayValue('태그1')
      await user.clear(input)
      await user.type(input, '수정된태그{Enter}')
      
      expect(screen.getByText('수정된태그')).toBeInTheDocument()
      expect(screen.queryByText('태그1')).not.toBeInTheDocument()
    })

    it('태그 수정 중 Escape로 취소된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const tag1 = screen.getByText('태그1')
      await user.click(tag1)
      
      const input = screen.getByDisplayValue('태그1')
      await user.type(input, '{Escape}')
      
      expect(screen.getByText('태그1')).toBeInTheDocument()
    })
  })

  describe('키보드 단축키', () => {
    it('Escape 키로 편집을 취소할 수 있다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '{Escape}')
      
      expect(screen.getByText('AI 태그')).toBeInTheDocument()
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('자동 저장', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('태그 변경 후 2초 후 자동으로 저장된다', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      await user.type(input, '새태그')
      
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(['태그1', '태그2', '태그3', '새태그'])
      })
    })
  })

  describe('저장 기능', () => {
    it('저장 버튼 클릭 시 저장된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const saveButton = screen.getByRole('button', { name: /저장/i })
      await user.click(saveButton)
      
      expect(defaultProps.onSave).toHaveBeenCalledWith(['태그1', '태그2', '태그3'])
    })
  })

  describe('취소 기능', () => {
    it('취소 버튼 클릭 시 편집이 취소된다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const cancelButton = screen.getByRole('button', { name: /취소/i })
      await user.click(cancelButton)
      
      expect(screen.getByText('AI 태그')).toBeInTheDocument()
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('태그 개수 제한', () => {
    it('최대 태그 개수를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} maxTags={6} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText(/3\/6/)).toBeInTheDocument()
    })

    it('태그 개수 초과 시 경고를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} maxTags={2} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText(/태그 개수 초과/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /저장/i })).toBeDisabled()
    })
  })

  describe('접근성', () => {
    it('편집 모드에서 적절한 ARIA 레이블을 가진다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      const input = screen.getByPlaceholderText('새 태그 입력...')
      expect(input).toBeInTheDocument()
    })

    it('키보드 단축키 안내를 표시한다', async () => {
      const user = userEvent.setup()
      render(<EditableTags {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(screen.getByText('Enter로 추가/수정, Esc로 취소')).toBeInTheDocument()
    })
  })
})
