// components/notes/note-page-actions.tsx
// 노트 상세 페이지의 액션 버튼들을 관리하는 클라이언트 컴포넌트
// 삭제 기능과 네비게이션 기능을 제공
// 관련 파일: app/notes/[id]/page.tsx, components/notes/delete-note-dialog.tsx

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Trash2Icon } from 'lucide-react'
import { DeleteNoteDialog } from './delete-note-dialog'

interface NotePageActionsProps {
  noteId: string
  noteTitle: string
}

export function NotePageActions({ noteId, noteTitle }: NotePageActionsProps) {
  const router = useRouter()

  const handleDeleteSuccess = () => {
    // 삭제 성공 시 노트 목록 페이지로 리다이렉트
    router.push('/notes')
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/notes">
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          노트 목록으로
        </Button>
      </Link>
      <Link href="/">
        <Button variant="outline" className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          대시보드
        </Button>
      </Link>
      <DeleteNoteDialog
        noteId={noteId}
        noteTitle={noteTitle}
        onDeleteSuccess={handleDeleteSuccess}
      >
        <Button 
          variant="destructive" 
          className="flex items-center gap-2"
        >
          <Trash2Icon className="w-4 h-4" />
          노트 삭제
        </Button>
      </DeleteNoteDialog>
    </div>
  )
}
