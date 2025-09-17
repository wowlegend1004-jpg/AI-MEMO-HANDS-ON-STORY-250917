// components/notes/editable-tags.tsx
// 편집 가능한 태그 컴포넌트
// AI가 생성한 태그를 개별적으로 추가, 삭제, 수정할 수 있는 컴포넌트로 중복 방지 및 개수 제한 기능 포함
// 관련 파일: components/ui/input.tsx, components/ui/button.tsx, components/ui/badge.tsx, lib/ai/edit-actions.ts

'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Edit2, Plus, X, Save, AlertCircle } from 'lucide-react'
import { updateTags } from '@/lib/ai/edit-actions'

interface EditableTagsProps {
  tags: string[]
  noteId: string
  onSave: (tags: string[]) => Promise<void>
  onCancel: () => void
  maxTags?: number
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
}

export function EditableTags({
  tags,
  noteId,
  onSave,
  onCancel,
  maxTags = 6,
  isEditing = false,
  onEditStart,
  onEditEnd
}: EditableTagsProps) {
  const [editMode, setEditMode] = useState(isEditing)
  const [editTags, setEditTags] = useState<string[]>(tags)
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null)
  const [editingTagValue, setEditingTagValue] = useState('')
  
  console.log('EditableTags 초기화:', { 
    tags, 
    editTags, 
    maxTags, 
    isEditing, 
    editMode 
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (editMode && inputRef.current) {
      // 약간의 지연을 두고 포커스 (DOM 업데이트 후)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 200)
    }
  }, [editMode])

  // 외부 편집 상태 변경 감지
  useEffect(() => {
    if (isEditing) {
      setEditMode(true)
      setEditTags([...tags])
      setError(null)
      onEditStart?.()
    } else {
      setEditMode(false)
    }
  }, [isEditing, onEditStart])

  // tags 변경 시 editTags 업데이트 (편집 모드가 아닐 때만)
  useEffect(() => {
    if (!editMode) {
      setEditTags([...tags])
    }
  }, [tags, editMode])

  // 내용 변경 감지
  useEffect(() => {
    setHasChanges(JSON.stringify(editTags.sort()) !== JSON.stringify(tags.sort()))
  }, [editTags, tags])

  // 자동 저장 (디바운싱)
  useEffect(() => {
    if (editMode && hasChanges && editTags.length > 0) {
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
  }, [editTags, editMode, hasChanges])

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
    if (!editMode) {
      setEditMode(true)
      setEditTags([...tags])
      setError(null)
      onEditStart?.()
    }
  }

  const handleEditCancel = () => {
    setEditMode(false)
    setEditTags([...tags])
    setNewTag('')
    setError(null)
    setHasChanges(false)
    setEditingTagIndex(null)
    setEditingTagValue('')
    onCancel()
    onEditEnd?.()
  }

  const handleSave = async () => {
    if (editTags.length > maxTags) {
      setError(`태그는 최대 ${maxTags}개까지 입력할 수 있습니다.`)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      await onSave(editTags)
      
      setEditMode(false)
      setHasChanges(false)
      setShowSaveIndicator(true)
      setEditingTagIndex(null)
      setEditingTagValue('')
      
      // 저장 완료 표시 후 숨김
      setTimeout(() => setShowSaveIndicator(false), 2000)
      
      onEditEnd?.()
    } catch (error) {
      console.error('태그 저장 실패:', error)
      setError('태그 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    
    console.log('handleAddTag 호출됨:', { 
      trimmedTag, 
      editTagsLength: editTags.length, 
      maxTags, 
      editTags 
    })
    
    if (!trimmedTag) return
    
    if (editTags.includes(trimmedTag)) {
      setError('이미 존재하는 태그입니다.')
      return
    }
    
    // 새 태그를 추가한 후의 개수가 최대 개수를 초과하는지 확인
    if (editTags.length + 1 > maxTags) {
      setError(`태그는 최대 ${maxTags}개까지 입력할 수 있습니다.`)
      return
    }
    
    setEditTags([...editTags, trimmedTag])
    setNewTag('')
    setError(null)
  }

  const handleRemoveTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index))
    setError(null)
  }

  const handleStartEditTag = (index: number) => {
    setEditingTagIndex(index)
    setEditingTagValue(editTags[index])
  }

  const handleSaveEditTag = () => {
    if (!editingTagValue.trim()) {
      handleRemoveTag(editingTagIndex!)
      setEditingTagIndex(null)
      setEditingTagValue('')
      return
    }

    const trimmedValue = editingTagValue.trim()
    
    if (editTags.includes(trimmedValue) && editTags[editingTagIndex!] !== trimmedValue) {
      setError('이미 존재하는 태그입니다.')
      return
    }
    
    const newTags = [...editTags]
    newTags[editingTagIndex!] = trimmedValue
    setEditTags(newTags)
    setEditingTagIndex(null)
    setEditingTagValue('')
    setError(null)
  }

  const handleCancelEditTag = () => {
    setEditingTagIndex(null)
    setEditingTagValue('')
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (editingTagIndex !== null) {
        handleSaveEditTag()
      } else {
        handleAddTag()
      }
    } else if (e.key === 'Escape') {
      if (editingTagIndex !== null) {
        handleCancelEditTag()
      } else {
        handleEditCancel()
      }
    }
  }

  const isOverLimit = editTags.length > maxTags
  const remainingTags = maxTags - editTags.length

  if (!editMode) {
    return (
      <Card className="p-4 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500 text-sm">태그가 없습니다.</span>
              )}
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
            태그 편집 중
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

        <div className="space-y-3">
          {/* 태그 목록 */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-white dark:bg-gray-800">
            {editTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-1">
                {editingTagIndex === index ? (
                  <Input
                    ref={editInputRef}
                    value={editingTagValue}
                    onChange={(e) => setEditingTagValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveEditTag}
                    className="h-6 text-xs px-2 py-1 min-w-[60px]"
                    autoFocus
                  />
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => handleStartEditTag(index)}
                  >
                    {tag}
                    <X 
                      className="h-3 w-3 ml-1 hover:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTag(index)
                      }}
                    />
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* 새 태그 입력 */}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="새 태그 입력..."
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={() => {
                console.log('+ 버튼 클릭됨:', { 
                  newTag: newTag.trim(), 
                  editTagsLength: editTags.length, 
                  maxTags,
                  disabled: !newTag.trim() || editTags.length >= maxTags
                })
                handleAddTag()
              }}
              disabled={!newTag.trim() || editTags.length >= maxTags}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 상태 표시 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {editTags.length}/{maxTags}
              </span>
              {isOverLimit && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  태그 개수 초과
                </span>
              )}
            </div>
            <div className="text-gray-500">
              Enter로 추가/수정, Esc로 취소
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
              disabled={isSaving || isOverLimit}
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
