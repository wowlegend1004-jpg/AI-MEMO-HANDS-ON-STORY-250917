// components/notes/editable-summary.tsx
// 편집 가능한 요약 컴포넌트
// AI가 생성한 요약을 인라인으로 편집할 수 있는 컴포넌트로 자동 저장 및 유효성 검사 기능 포함
// 관련 파일: components/ui/textarea.tsx, components/ui/button.tsx, lib/ai/edit-actions.ts

'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Edit2, Save, X, AlertCircle } from 'lucide-react'
import { updateSummary } from '@/lib/ai/edit-actions'

interface EditableSummaryProps {
  summary: string
  noteId: string
  onSave: (content: string) => Promise<void>
  onCancel: () => void
  maxLength?: number
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
}

export function EditableSummary({
  summary,
  noteId,
  onSave,
  onCancel,
  maxLength = 500,
  isEditing = false,
  onEditStart,
  onEditEnd
}: EditableSummaryProps) {
  const [editMode, setEditMode] = useState(isEditing)
  const [editContent, setEditContent] = useState(summary)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editMode])

  // 외부 편집 상태 변경 감지
  useEffect(() => {
    setEditMode(isEditing)
  }, [isEditing])

  // 내용 변경 감지
  useEffect(() => {
    setHasChanges(editContent !== summary)
  }, [editContent, summary])

  // 자동 저장 (디바운싱)
  useEffect(() => {
    if (editMode && hasChanges && editContent.trim()) {
      // 기존 타이머 클리어
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // 2초 후 자동 저장
      saveTimeoutRef.current = setTimeout(async () => {
        await handleSave()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editContent, editMode, hasChanges])

  // 페이지 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editMode && hasChanges) {
        e.preventDefault()
        e.returnValue = '편집 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?'
      }
    }

    if (editMode && hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [editMode, hasChanges])

  const handleEditStart = () => {
    setEditMode(true)
    setEditContent(summary)
    setError(null)
    onEditStart?.()
  }

  const handleEditCancel = () => {
    setEditMode(false)
    setEditContent(summary)
    setError(null)
    setHasChanges(false)
    onCancel()
    onEditEnd?.()
  }

  const handleSave = async () => {
    if (!editContent.trim()) {
      setError('요약 내용을 입력해주세요.')
      return
    }

    if (editContent.length > maxLength) {
      setError(`요약은 최대 ${maxLength}자까지 입력할 수 있습니다.`)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      await onSave(editContent.trim())
      
      setEditMode(false)
      setHasChanges(false)
      setShowSaveIndicator(true)
      
      // 저장 완료 표시 후 숨김
      setTimeout(() => setShowSaveIndicator(false), 2000)
      
      onEditEnd?.()
    } catch (error) {
      console.error('요약 저장 실패:', error)
      setError('요약 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleEditCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const remainingChars = maxLength - editContent.length
  const isOverLimit = remainingChars < 0

  if (!editMode) {
    return (
      <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 요약
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {summary || '요약이 없습니다.'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditStart}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            요약 편집 중
          </h3>
          <div className="flex items-center gap-2">
            {showSaveIndicator && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Save className="h-3 w-3" />
                저장됨
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="요약 내용을 입력하세요..."
            className={`min-h-[100px] resize-none ${
              isOverLimit ? 'border-red-300 focus:border-red-500' : ''
            }`}
            maxLength={maxLength + 50} // UI에서 제한을 조금 더 여유있게
          />

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {editContent.length}/{maxLength}
              </span>
              {isOverLimit && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  글자 수 초과
                </span>
              )}
            </div>
            <div className="text-gray-500">
              Ctrl+Enter로 저장, Esc로 취소
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !editContent.trim() || isOverLimit}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button
              variant="outline"
              onClick={handleEditCancel}
              disabled={isSaving}
              size="sm"
            >
              취소
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
