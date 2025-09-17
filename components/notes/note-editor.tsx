// components/notes/note-editor.tsx
// 노트 편집기 컴포넌트
// 노트 제목과 본문을 실시간으로 편집하고 자동 저장하는 통합 편집기
// 관련 파일: components/notes/auto-save-indicator.tsx, lib/notes/actions.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AutoSaveIndicator, SaveStatus } from './auto-save-indicator'
import { updateNote } from '@/lib/notes/actions'
import { Note } from '@/lib/db/schema/notes'
import { Save, Loader2 } from 'lucide-react'

interface NoteEditorProps {
  note: Note
  onSave?: (updatedNote: Note) => void
  className?: string
}

const DEBOUNCE_DELAY = 3000 // 3초
const MAX_RETRY_ATTEMPTS = 3

export function NoteEditor({ note, onSave, className }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  const performSave = useCallback(async () => {
    try {
      console.log('자동 저장 시작:', { noteId: note.id, title, content })
      setSaveStatus('saving')
      setErrorMessage('')

      const updatedNote = await updateNote(note.id, {
        title: title.trim() || '제목 없음',
        content: content.trim()
      })

      console.log('자동 저장 성공:', updatedNote)
      setSaveStatus('saved')
      setLastSaved(new Date())
      retryCountRef.current = 0

      // 부모 컴포넌트에 저장 완료 알림
      if (onSave) {
        onSave(updatedNote)
      }
    } catch (error) {
      console.error('자동 저장 실패:', error)
      
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
      setErrorMessage(errorMsg)
      setSaveStatus('error')

      // 재시도 로직
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1
        console.log(`자동 저장 재시도 ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}`)
        setTimeout(() => {
          performSave()
        }, 3000) // 3초 후 재시도
      }
    }
  }, [note.id, title, content, onSave])

  const triggerAutoSave = useCallback(() => {
    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 새 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, DEBOUNCE_DELAY)
  }, [performSave])

  // 초기 로드 시에는 자동 저장하지 않음
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }
    
    // 제목이나 내용이 변경된 경우에만 자동 저장 트리거
    if (title !== note.title || content !== (note.content || '')) {
      triggerAutoSave()
    }
  }, [title, content, note.title, note.content, triggerAutoSave])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleManualSave = async () => {
    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 즉시 저장 실행
    await performSave()
  }

  const hasChanges = title !== note.title || content !== (note.content || '')

  return (
    <div className={className}>
      {/* 제목 입력 */}
      <div className="mb-4">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="제목을 입력하세요"
          className="text-2xl font-semibold border-none shadow-none p-0 focus-visible:ring-0"
        />
      </div>

      {/* 본문 입력 */}
      <div className="mb-4">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="내용을 입력하세요..."
          className="min-h-[400px] resize-none border-none shadow-none p-0 focus-visible:ring-0 text-base leading-relaxed"
        />
      </div>

      {/* 저장 컨트롤 및 상태 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving' || !hasChanges}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveStatus === 'saving' ? '저장 중...' : '저장'}
          </Button>
          {hasChanges && saveStatus !== 'saving' && (
            <span className="text-sm text-orange-600">
              저장되지 않은 변경사항이 있습니다
            </span>
          )}
        </div>
        <AutoSaveIndicator
          status={saveStatus}
          lastSaved={lastSaved}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
