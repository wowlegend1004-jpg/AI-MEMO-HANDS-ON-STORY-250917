// components/notes/delete-note-dialog.tsx
// 노트 삭제 확인 다이얼로그 컴포넌트
// 사용자가 노트를 삭제하기 전 확인을 받는 모달 다이얼로그
// 관련 파일: components/ui/dialog.tsx, components/ui/button.tsx, lib/notes/actions.ts

'use client'

import { useState } from 'react'
import { Trash2Icon, Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteNote } from '@/lib/notes/actions'

interface DeleteNoteDialogProps {
  noteId: string
  noteTitle: string
  onDeleteSuccess?: () => void
  children: React.ReactNode
}

export function DeleteNoteDialog({ 
  noteId, 
  noteTitle, 
  onDeleteSuccess,
  children 
}: DeleteNoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      
      await deleteNote(noteId)
      
      // 성공 시 다이얼로그 닫기 및 콜백 실행
      setIsOpen(false)
      onDeleteSuccess?.()
    } catch (error) {
      console.error('노트 삭제 오류:', error)
      
      // 에러 타입에 따른 메시지 설정
      if (error instanceof Error) {
        if (error.message === 'NOT_FOUND') {
          setError('삭제할 노트를 찾을 수 없습니다.')
        } else if (error.message === 'FORBIDDEN') {
          setError('이 노트를 삭제할 권한이 없습니다.')
        } else {
          setError('노트 삭제에 실패했습니다. 다시 시도해주세요.')
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null)
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            노트 삭제 확인
          </DialogTitle>
          <DialogDescription>
            <strong>&ldquo;{noteTitle}&rdquo;</strong> 노트를 삭제하시겠습니까?
            <br />
            <span className="text-destructive font-medium">
              이 작업은 되돌릴 수 없습니다.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2Icon className="h-4 w-4" />
                삭제
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
