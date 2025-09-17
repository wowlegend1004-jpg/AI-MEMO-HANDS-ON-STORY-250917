// app/notes/[id]/page.tsx
// 개별 노트 상세 조회 및 편집 페이지
// 노트 ID를 통해 특정 노트의 상세 내용을 표시하고 실시간 편집 기능을 제공하는 페이지
// 관련 파일: lib/notes/actions.ts, components/notes/note-editor.tsx, components/notes/error-pages.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNoteById } from '@/lib/notes/actions'
import { MarkdownEditor } from '@/components/notes/markdown-editor'
import { NoteErrorPage } from '@/components/notes/error-pages'
import { NotePageActions } from '@/components/notes/note-page-actions'
import { NoteSummarySection } from '@/components/notes/note-summary-section'
import { NoteTagSection } from '@/components/notes/note-tag-section'

interface NotePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NotePage({ params }: NotePageProps) {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  // 노트 조회 및 에러 처리
  let note
  let errorType: '404' | '403' | 'error' | null = null
  let errorMessage = ''

  try {
    const resolvedParams = await params
    console.log('노트 상세 페이지 접근:', { noteId: resolvedParams.id })
    note = await getNoteById(resolvedParams.id)
    console.log('노트 조회 성공:', { noteId: note.id, title: note.title })
  } catch (error) {
    console.error('노트 조회 오류:', error)
    
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        console.log('404 에러 처리: 노트를 찾을 수 없음')
        errorType = '404'
        errorMessage = '요청하신 노트를 찾을 수 없습니다.'
      } else if (error.message === 'FORBIDDEN') {
        console.log('403 에러 처리: 권한 없음')
        errorType = '403'
        errorMessage = '이 노트에 접근할 권한이 없습니다.'
      } else {
        console.log('일반 에러 처리:', error.message)
        errorType = 'error'
        errorMessage = '노트를 불러오는 중 오류가 발생했습니다.'
      }
    } else {
      console.log('알 수 없는 에러 타입')
      errorType = 'error'
      errorMessage = '알 수 없는 오류가 발생했습니다.'
    }
  }

  // 에러가 발생한 경우 에러 페이지 표시
  if (errorType) {
    return <NoteErrorPage type={errorType} message={errorMessage} />
  }

  // 노트가 없는 경우 404 에러
  if (!note) {
    return <NoteErrorPage type="404" message="노트를 찾을 수 없습니다." />
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 네비게이션 바 */}
      <div className="mb-6">
        <NotePageActions noteId={note.id} noteTitle={note.title} />
      </div>

      {/* 노트 메타 정보 */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        생성일: {note.createdAt ? formatDate(note.createdAt) : '알 수 없음'}
        {note.createdAt !== note.updatedAt && note.updatedAt && (
          <span className="ml-2">
            | 수정일: {formatDate(note.updatedAt)}
          </span>
        )}
      </div>

      {/* AI 요약 섹션 */}
      <div className="mb-6">
        <NoteSummarySection 
          noteId={note.id} 
          content={note.content || ''} 
          userId={user.id}
        />
      </div>

      {/* AI 태그 섹션 */}
      <div className="mb-6">
        <NoteTagSection 
          noteId={note.id} 
          content={note.content || ''} 
          userId={user.id}
        />
      </div>

      {/* 마크다운 편집기 */}
      <MarkdownEditor 
        note={note}
        className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border"
      />
    </div>
  )
}
