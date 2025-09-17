// components/notes/markdown-editor.tsx
// 마크다운 에디터 컴포넌트
// 마크다운 문법을 지원하는 리치 텍스트 에디터 제공
// 관련 파일: components/notes/note-editor.tsx, lib/notes/actions.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AutoSaveIndicator, SaveStatus } from './auto-save-indicator'
import { AITextGenerator } from '@/components/ai/ai-text-generator'
import { updateNote } from '@/lib/notes/actions'
import { Note } from '@/lib/db/schema/notes'
import { Save, Loader2, Eye, Edit3, Sparkles } from 'lucide-react'

// 동적 임포트로 마크다운 에디터 로드 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownEditorProps {
  note: Note
  onSave?: (updatedNote: Note) => void
  className?: string
}

const DEBOUNCE_DELAY = 3000 // 3초
const MAX_RETRY_ATTEMPTS = 3

export function MarkdownEditor({ note, onSave, className }: MarkdownEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  const performSave = useCallback(async () => {
    try {
      console.log('마크다운 자동 저장 시작:', { noteId: note.id, title, content })
      setSaveStatus('saving')
      setErrorMessage('')

      const updatedNote = await updateNote(note.id, {
        title: title.trim() || '제목 없음',
        content: content.trim()
      })

      console.log('마크다운 자동 저장 성공:', updatedNote)
      setSaveStatus('saved')
      setLastSaved(new Date())
      retryCountRef.current = 0

      // 부모 컴포넌트에 저장 완료 알림
      if (onSave) {
        onSave(updatedNote)
      }
    } catch (error) {
      console.error('마크다운 자동 저장 실패:', error)
      
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
      setErrorMessage(errorMsg)
      setSaveStatus('error')

      // 재시도 로직
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1
        console.log(`마크다운 자동 저장 재시도 ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}`)
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

  const handleContentChange = (value?: string) => {
    setContent(value || '')
  }

  const handleManualSave = async () => {
    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 즉시 저장 실행
    await performSave()
  }

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const toggleAIGenerator = () => {
    setShowAIGenerator(!showAIGenerator)
  }

  const handleAITextGenerated = (text: string) => {
    // 현재 내용에 AI 생성 텍스트 추가
    const newContent = content ? `${content}\n\n${text}` : text
    setContent(newContent)
    setShowAIGenerator(false)
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

      {/* 마크다운 에디터 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            마크다운 에디터
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleAIGenerator}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI 도움
            </Button>
            <Button
              onClick={togglePreviewMode}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  편집
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  미리보기
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <MDEditor
            value={content}
            onChange={handleContentChange}
            data-color-mode="light"
            height={400}
            preview={isPreviewMode ? 'preview' : 'edit'}
            hideToolbar={false}
            textareaProps={{
              placeholder: '마크다운 문법을 사용하여 내용을 작성하세요...\n\n예시:\n# 제목\n## 부제목\n\n**굵은 글씨** *기울임* \n\n- 목록 항목 1\n- 목록 항목 2\n\n1. 번호 목록 1\n2. 번호 목록 2\n\n```코드 블록```\n\n[링크](https://example.com)',
            }}
          />
        </div>
      </div>

      {/* AI 텍스트 생성기 */}
      {showAIGenerator && (
        <div className="mb-4">
          <AITextGenerator
            onTextGenerated={handleAITextGenerated}
            className="border-2 border-purple-200 dark:border-purple-800"
          />
        </div>
      )}

      {/* 마크다운 도움말 */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          마크다운 문법 도움말
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div><code># 제목</code> - 큰 제목</div>
          <div><code>## 부제목</code> - 작은 제목</div>
          <div><code>**굵은 글씨**</code> - 굵은 글씨</div>
          <div><code>*기울임*</code> - 기울임</div>
          <div><code>- 목록</code> - 순서 없는 목록</div>
          <div><code>1. 번호</code> - 순서 있는 목록</div>
          <div><code>`코드`</code> - 인라인 코드</div>
          <div><code>```코드 블록```</code> - 코드 블록</div>
          <div><code>[링크](URL)</code> - 링크</div>
        </div>
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
