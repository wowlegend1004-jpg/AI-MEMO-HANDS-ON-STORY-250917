// components/notes/note-summary-section.tsx
// 노트 요약 섹션 컴포넌트
// 노트 상세 페이지에서 요약 표시, 생성, 편집을 담당하는 통합 컴포넌트
// 관련 파일: components/notes/summary-display.tsx, components/notes/summary-generator.tsx, components/notes/editable-summary.tsx, lib/ai/summary-actions.ts

'use client'

import { useState, useEffect } from 'react'
import { getSummary } from '@/lib/ai/summary-actions'
import { updateSummary } from '@/lib/ai/edit-actions'
import { SummaryDisplay } from './summary-display'
import { SummaryGenerator } from './summary-generator'
import { EditableSummary } from './editable-summary'
import { useEditableContent } from '@/hooks/use-editable-content'

interface NoteSummarySectionProps {
  noteId: string
  content: string
  userId: string
  onEditStateChange?: (isEditing: boolean) => void
}

export function NoteSummarySection({ 
  noteId, 
  content, 
  userId,
  onEditStateChange 
}: NoteSummarySectionProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { 
    state, 
    actions, 
    isAIButtonDisabled 
  } = useEditableContent()

  // 컴포넌트 마운트 시 기존 요약 조회
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await getSummary(noteId)
        
        if (result.success) {
          setSummary(result.summary || null)
        } else {
          setError(result.error || '요약을 불러올 수 없습니다.')
        }
      } catch (error) {
        console.error('요약 로드 오류:', error)
        setError('요약을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [noteId])

  // 편집 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onEditStateChange?.(state.isSummaryEditing)
  }, [state.isSummaryEditing, onEditStateChange])

  const handleSummaryChange = (newSummary: string | null) => {
    setSummary(newSummary)
  }

  const handleSummarySave = async (newSummary: string) => {
    try {
      actions.setSaving(true)
      actions.setError(null)

      const result = await updateSummary(noteId, newSummary)
      
      if (result.success) {
        setSummary(newSummary)
        actions.endSummaryEdit()
      } else {
        actions.setError(result.error || '요약 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 저장 오류:', error)
      actions.setError('요약 저장 중 오류가 발생했습니다.')
    } finally {
      actions.setSaving(false)
    }
  }

  const handleSummaryCancel = () => {
    actions.endSummaryEdit()
  }

  const handleSummaryEditStart = () => {
    actions.startSummaryEdit()
  }

  const handleSummaryEditEnd = () => {
    actions.endSummaryEdit()
  }

  // 편집 모드인 경우 편집 가능한 컴포넌트 표시
  if (state.isSummaryEditing) {
    return (
      <EditableSummary
        summary={summary || ''}
        noteId={noteId}
        onSave={handleSummarySave}
        onCancel={handleSummaryCancel}
        isEditing={state.isSummaryEditing}
        onEditStart={handleSummaryEditStart}
        onEditEnd={handleSummaryEditEnd}
        maxLength={500}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* 요약 생성 버튼 */}
      <SummaryGenerator
        noteId={noteId}
        content={content}
        userId={userId}
        onSummaryGenerated={handleSummaryChange}
        disabled={isLoading || isAIButtonDisabled}
      />

      {/* 요약 표시 */}
      <SummaryDisplay
        noteId={noteId}
        summary={summary || undefined}
        isLoading={isLoading}
        onSummaryChange={handleSummaryChange}
        onEditStart={handleSummaryEditStart}
        disabled={isAIButtonDisabled}
      />
    </div>
  )
}
