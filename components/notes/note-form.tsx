// components/notes/note-form.tsx
// 노트 작성 폼 컴포넌트 (마크다운 지원)
// 제목과 본문을 마크다운으로 입력할 수 있는 폼으로 저장/취소 기능을 제공
// 관련 파일: app/notes/new/page.tsx, lib/notes/actions.ts, components/ui/*

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { AITextGenerator } from '@/components/ai/ai-text-generator'
import { createNote } from '@/lib/notes/actions'
import { Eye, Edit3, Sparkles } from 'lucide-react'

// 동적 임포트로 마크다운 에디터 로드 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

export function NoteForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await createNote({
        title: title.trim() || '제목 없음',
        content: content.trim() || ''
      })
      
      // 성공 시 노트 목록으로 리다이렉트
      router.push('/notes')
    } catch (err) {
      setError(err instanceof Error ? err.message : '노트 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const handleContentChange = (value?: string) => {
    setContent(value || '')
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

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              type="text"
              placeholder="노트 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">본문 (마크다운 지원)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={toggleAIGenerator}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  AI 도움
                </Button>
                <Button
                  type="button"
                  onClick={togglePreviewMode}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isLoading}
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
                height={300}
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
            <AITextGenerator
              onTextGenerated={handleAITextGenerated}
              className="border-2 border-purple-200 dark:border-purple-800"
            />
          )}

          {/* 마크다운 도움말 */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2 p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
