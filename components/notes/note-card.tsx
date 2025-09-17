// components/notes/note-card.tsx
// 개별 노트를 표시하는 카드 컴포넌트
// 노트 제목, 내용 미리보기, 생성일/수정일 정보를 표시하고 삭제 기능 제공
// 관련 파일: app/notes/page.tsx, lib/db/schema/notes.ts, components/notes/delete-note-dialog.tsx

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2Icon, ExternalLinkIcon } from 'lucide-react'
import { Note } from '@/lib/db/schema/notes'
import { DeleteNoteDialog } from './delete-note-dialog'

// 동적 임포트로 마크다운 뷰어 로드 (SSR 방지)
const MDViewer = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
)

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const router = useRouter()

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

  const truncateContent = (content: string | null, maxLength: number = 150) => {
    if (!content) return '내용이 없습니다.'
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const isMarkdown = (content: string | null) => {
    if (!content) return false
    // 마크다운 문법이 포함되어 있는지 확인
    const markdownPatterns = [
      /^#{1,6}\s/, // 헤더
      /\*\*.*\*\*/, // 굵은 글씨
      /\*.*\*/, // 기울임
      /`.*`/, // 인라인 코드
      /```[\s\S]*```/, // 코드 블록
      /^\s*[-*+]\s/, // 목록
      /^\s*\d+\.\s/, // 번호 목록
      /\[.*\]\(.*\)/, // 링크
    ]
    return markdownPatterns.some(pattern => pattern.test(content))
  }

  const handleDeleteSuccess = () => {
    // 삭제 성공 시 페이지 새로고침
    router.refresh()
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {note.title}
            </CardTitle>
            <CardDescription className="text-sm">
              수정일: {note.updatedAt ? formatDate(note.updatedAt) : '알 수 없음'}
              {note.createdAt !== note.updatedAt && note.createdAt && (
                <span className="ml-2 text-gray-400">
                  (생성일: {formatDate(note.createdAt)})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Link href={`/notes/${note.id}`}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLinkIcon className="h-4 w-4" />
                <span className="sr-only">노트 보기</span>
              </Button>
            </Link>
            <DeleteNoteDialog
              noteId={note.id}
              noteTitle={note.title}
              onDeleteSuccess={handleDeleteSuccess}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2Icon className="h-4 w-4" />
                <span className="sr-only">노트 삭제</span>
              </Button>
            </DeleteNoteDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={`/notes/${note.id}`} className="block">
          <div className="text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            {isMarkdown(note.content) ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MDViewer 
                  source={truncateContent(note.content)} 
                  data-color-mode="light"
                  components={{
                    a: ({ children, ...props }) => (
                      <span className="text-blue-600 dark:text-blue-400">
                        {children}
                      </span>
                    )
                  }}
                />
              </div>
            ) : (
              <p>{truncateContent(note.content)}</p>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
