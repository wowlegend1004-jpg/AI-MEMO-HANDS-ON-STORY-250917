// components/notes/note-tag-section.tsx
// 노트 태그 섹션 통합 컴포넌트
// 태그 표시, 생성, 편집 기능을 통합한 섹션 컴포넌트
// 관련 파일: components/notes/tag-display.tsx, components/notes/tag-generator.tsx, components/notes/editable-tags.tsx, lib/ai/tag-actions.ts

'use client'

import { useState, useEffect } from 'react'
import { TagDisplay } from './tag-display'
import { TagGenerator } from './tag-generator'
import { EditableTags } from './editable-tags'
import { getTags } from '@/lib/ai/tag-actions'
import { updateTags } from '@/lib/ai/edit-actions'

interface NoteTagSectionProps {
  noteId: string
  content: string
  userId: string
  initialTags?: string[]
  onEditStateChange?: (isEditing: boolean) => void
}

export function NoteTagSection({ 
  noteId, 
  content, 
  userId,
  initialTags = [],
  onEditStateChange 
}: NoteTagSectionProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 초기 태그 로드
  useEffect(() => {
    const loadTags = async () => {
      if (hasLoaded) return
      
      setIsLoading(true)
      try {
        const result = await getTags(noteId)
        if (result.success && result.tags) {
          setTags(result.tags)
        }
      } catch (error) {
        console.error('태그 로드 실패:', error)
      } finally {
        setIsLoading(false)
        setHasLoaded(true)
      }
    }

    loadTags()
  }, [noteId, hasLoaded])

  // 편집 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onEditStateChange?.(isEditing)
  }, [isEditing, onEditStateChange])

  const handleTagsGenerated = (newTags: string[]) => {
    setTags(newTags)
  }

  const handleTagsUpdated = () => {
    // 태그가 업데이트되었을 때 다시 로드
    setHasLoaded(false)
  }

  const handleTagsSave = async (newTags: string[]) => {
    try {
      setIsSaving(true)
      setError(null)

      const result = await updateTags(noteId, newTags)
      
      if (result.success) {
        setTags(newTags)
        setIsEditing(false)
        onEditStateChange?.(false)
      } else {
        setError(result.error || '태그 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('태그 저장 오류:', error)
      setError('태그 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagsCancel = () => {
    setIsEditing(false)
    onEditStateChange?.(false)
  }

  const handleTagsEditStart = () => {
    setIsEditing(true)
  }

  const handleTagsEditEnd = () => {
    setIsEditing(false)
  }

  // 편집 모드인 경우 편집 가능한 컴포넌트 표시
  if (isEditing) {
    return (
      <EditableTags
        tags={tags}
        noteId={noteId}
        onSave={handleTagsSave}
        onCancel={handleTagsCancel}
        isEditing={true}
        onEditStart={handleTagsEditStart}
        onEditEnd={handleTagsEditEnd}
        maxTags={6}
      />
    )
  }

  return (
    <div className="space-y-4">
      <TagDisplay
        noteId={noteId}
        tags={tags}
        isLoading={isLoading}
        onRegenerate={handleTagsUpdated}
        onDelete={handleTagsUpdated}
        onEditStart={handleTagsEditStart}
        disabled={isEditing || isSaving}
      />
      
      {tags.length === 0 && !isLoading && (
        <TagGenerator
          noteId={noteId}
          content={content}
          userId={userId}
          onTagsGenerated={handleTagsGenerated}
          disabled={isEditing || isSaving}
        />
      )}
    </div>
  )
}
