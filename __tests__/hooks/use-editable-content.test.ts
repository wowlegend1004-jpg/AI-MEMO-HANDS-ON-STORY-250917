// __tests__/hooks/use-editable-content.test.ts
// 편집 상태 관리 훅 테스트
// useEditableContent 훅의 상태 관리 및 액션들을 테스트
// 관련 파일: hooks/use-editable-content.ts

import { renderHook, act } from '@testing-library/react'
import { useEditableContent } from '@/hooks/use-editable-content'

describe('useEditableContent', () => {
  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() => useEditableContent())

    expect(result.current.state).toEqual({
      isSummaryEditing: false,
      isTagsEditing: false,
      hasUnsavedChanges: false,
      isSaving: false,
      error: null
    })
  })

  it('초기 상태에서 AI 버튼이 비활성화되지 않는다', () => {
    const { result } = renderHook(() => useEditableContent())

    expect(result.current.isAIButtonDisabled).toBe(false)
    expect(result.current.isEditing).toBe(false)
    expect(result.current.shouldWarnOnLeave).toBe(false)
  })

  describe('요약 편집', () => {
    it('startSummaryEdit으로 요약 편집을 시작한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(true)
      expect(result.current.isAIButtonDisabled).toBe(true)
      expect(result.current.isEditing).toBe(true)
    })

    it('endSummaryEdit으로 요약 편집을 종료한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
        result.current.actions.setUnsavedChanges(true)
      })

      act(() => {
        result.current.actions.endSummaryEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(false)
      expect(result.current.state.hasUnsavedChanges).toBe(false)
      expect(result.current.isAIButtonDisabled).toBe(false)
      expect(result.current.isEditing).toBe(false)
    })
  })

  describe('태그 편집', () => {
    it('startTagsEdit으로 태그 편집을 시작한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startTagsEdit()
      })

      expect(result.current.state.isTagsEditing).toBe(true)
      expect(result.current.isAIButtonDisabled).toBe(true)
      expect(result.current.isEditing).toBe(true)
    })

    it('endTagsEdit으로 태그 편집을 종료한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startTagsEdit()
        result.current.actions.setUnsavedChanges(true)
      })

      act(() => {
        result.current.actions.endTagsEdit()
      })

      expect(result.current.state.isTagsEditing).toBe(false)
      expect(result.current.state.hasUnsavedChanges).toBe(false)
      expect(result.current.isAIButtonDisabled).toBe(false)
      expect(result.current.isEditing).toBe(false)
    })
  })

  describe('상태 관리', () => {
    it('setSaving으로 저장 상태를 설정한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.setSaving(true)
      })

      expect(result.current.state.isSaving).toBe(true)
      expect(result.current.isAIButtonDisabled).toBe(true)

      act(() => {
        result.current.actions.setSaving(false)
      })

      expect(result.current.state.isSaving).toBe(false)
      expect(result.current.isAIButtonDisabled).toBe(false)
    })

    it('setError로 에러 상태를 설정한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.setError('테스트 에러')
      })

      expect(result.current.state.error).toBe('테스트 에러')

      act(() => {
        result.current.actions.setError(null)
      })

      expect(result.current.state.error).toBe(null)
    })

    it('setUnsavedChanges로 변경사항 상태를 설정한다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.setUnsavedChanges(true)
      })

      expect(result.current.state.hasUnsavedChanges).toBe(true)

      act(() => {
        result.current.actions.setUnsavedChanges(false)
      })

      expect(result.current.state.hasUnsavedChanges).toBe(false)
    })
  })

  describe('복합 상태', () => {
    it('요약과 태그를 동시에 편집할 수 없다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
        result.current.actions.startTagsEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(true)
      expect(result.current.state.isTagsEditing).toBe(true)
      expect(result.current.isAIButtonDisabled).toBe(true)
      expect(result.current.isEditing).toBe(true)
    })

    it('저장 중일 때 AI 버튼이 비활성화된다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.setSaving(true)
      })

      expect(result.current.isAIButtonDisabled).toBe(true)
    })

    it('편집 중이고 변경사항이 있을 때 페이지 이탈 경고가 활성화된다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
        result.current.actions.setUnsavedChanges(true)
      })

      expect(result.current.shouldWarnOnLeave).toBe(true)
    })

    it('편집 중이지만 변경사항이 없을 때 페이지 이탈 경고가 비활성화된다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
        result.current.actions.setUnsavedChanges(false)
      })

      expect(result.current.shouldWarnOnLeave).toBe(false)
    })

    it('편집 중이 아닐 때 페이지 이탈 경고가 비활성화된다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.setUnsavedChanges(true)
      })

      expect(result.current.shouldWarnOnLeave).toBe(false)
    })
  })

  describe('리셋 기능', () => {
    it('reset으로 모든 상태를 초기화한다', () => {
      const { result } = renderHook(() => useEditableContent())

      // 상태 변경
      act(() => {
        result.current.actions.startSummaryEdit()
        result.current.actions.startTagsEdit()
        result.current.actions.setSaving(true)
        result.current.actions.setError('에러')
        result.current.actions.setUnsavedChanges(true)
      })

      // 리셋
      act(() => {
        result.current.actions.reset()
      })

      expect(result.current.state).toEqual({
        isSummaryEditing: false,
        isTagsEditing: false,
        hasUnsavedChanges: false,
        isSaving: false,
        error: null
      })
      expect(result.current.isAIButtonDisabled).toBe(false)
      expect(result.current.isEditing).toBe(false)
      expect(result.current.shouldWarnOnLeave).toBe(false)
    })
  })

  describe('상태 전환', () => {
    it('요약 편집에서 태그 편집으로 전환할 수 있다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startSummaryEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(true)
      expect(result.current.state.isTagsEditing).toBe(false)

      act(() => {
        result.current.actions.startTagsEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(true)
      expect(result.current.state.isTagsEditing).toBe(true)
    })

    it('태그 편집에서 요약 편집으로 전환할 수 있다', () => {
      const { result } = renderHook(() => useEditableContent())

      act(() => {
        result.current.actions.startTagsEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(false)
      expect(result.current.state.isTagsEditing).toBe(true)

      act(() => {
        result.current.actions.startSummaryEdit()
      })

      expect(result.current.state.isSummaryEditing).toBe(true)
      expect(result.current.state.isTagsEditing).toBe(true)
    })
  })
})
