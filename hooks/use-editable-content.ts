// hooks/use-editable-content.ts
// 편집 상태 관리 훅
// 요약/태그 편집 상태를 관리하고 AI 재생성 버튼 상태를 제어하는 커스텀 훅
// 관련 파일: components/notes/editable-summary.tsx, components/notes/editable-tags.tsx

'use client'

import { useState, useCallback } from 'react'

export interface EditableContentState {
  isSummaryEditing: boolean
  isTagsEditing: boolean
  hasUnsavedChanges: boolean
  isSaving: boolean
  error: string | null
}

export interface EditableContentActions {
  startSummaryEdit: () => void
  endSummaryEdit: () => void
  startTagsEdit: () => void
  endTagsEdit: () => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  setUnsavedChanges: (hasChanges: boolean) => void
  reset: () => void
}

export function useEditableContent() {
  const [state, setState] = useState<EditableContentState>({
    isSummaryEditing: false,
    isTagsEditing: false,
    hasUnsavedChanges: false,
    isSaving: false,
    error: null
  })

  const startSummaryEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSummaryEditing: true,
      error: null
    }))
  }, [])

  const endSummaryEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSummaryEditing: false,
      hasUnsavedChanges: false
    }))
  }, [])

  const startTagsEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTagsEditing: true,
      error: null
    }))
  }, [])

  const endTagsEdit = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTagsEditing: false,
      hasUnsavedChanges: false
    }))
  }, [])

  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({
      ...prev,
      isSaving: saving
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }, [])

  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isSummaryEditing: false,
      isTagsEditing: false,
      hasUnsavedChanges: false,
      isSaving: false,
      error: null
    })
  }, [])

  // AI 재생성 버튼 비활성화 여부
  const isAIButtonDisabled = state.isSummaryEditing || state.isTagsEditing || state.isSaving

  // 편집 중인지 여부
  const isEditing = state.isSummaryEditing || state.isTagsEditing

  // 페이지 이탈 경고 필요 여부
  const shouldWarnOnLeave = state.hasUnsavedChanges && isEditing

  const actions: EditableContentActions = {
    startSummaryEdit,
    endSummaryEdit,
    startTagsEdit,
    endTagsEdit,
    setSaving,
    setError,
    setUnsavedChanges,
    reset
  }

  return {
    state,
    actions,
    isAIButtonDisabled,
    isEditing,
    shouldWarnOnLeave
  }
}
