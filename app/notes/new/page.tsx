// app/notes/new/page.tsx
// 노트 작성 페이지
// 사용자가 새로운 노트를 작성할 수 있는 페이지로 제목과 본문을 입력할 수 있음
// 관련 파일: components/notes/note-form.tsx, lib/notes/actions.ts

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import { NoteForm } from '@/components/notes/note-form'

export default function NewNotePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 네비게이션 바 */}
      <div className="mb-6">
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
              메인 화면으로
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          새 노트 작성
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          제목과 본문을 입력하여 새로운 노트를 작성하세요.
        </p>
      </div>
      
      <NoteForm />
    </div>
  )
}
