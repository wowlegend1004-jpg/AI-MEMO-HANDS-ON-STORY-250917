// components/notes/error-pages.tsx
// 노트 관련 에러 페이지 컴포넌트
// 404, 403 등 노트 접근 시 발생하는 에러 상황을 처리하는 UI 컴포넌트
// 관련 파일: app/notes/[id]/page.tsx, lib/notes/actions.ts

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Home, AlertTriangle, Lock } from 'lucide-react'

interface ErrorPageProps {
  type: '404' | '403' | 'error'
  message?: string
  className?: string
}

export function NoteErrorPage({ type, message, className }: ErrorPageProps) {
  const getErrorContent = () => {
    switch (type) {
      case '404':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
          title: '노트를 찾을 수 없습니다',
          description: '요청하신 노트가 존재하지 않거나 삭제되었습니다.',
          message: message || '노트가 존재하지 않습니다.'
        }
      case '403':
        return {
          icon: <Lock className="w-16 h-16 text-red-500" />,
          title: '접근 권한이 없습니다',
          description: '이 노트에 접근할 권한이 없습니다.',
          message: message || '권한이 없는 노트입니다.'
        }
      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-red-500" />,
          title: '오류가 발생했습니다',
          description: '예상치 못한 오류가 발생했습니다.',
          message: message || '알 수 없는 오류가 발생했습니다.'
        }
    }
  }

  const errorContent = getErrorContent()

  return (
    <div className={`container mx-auto py-8 px-4 max-w-2xl ${className || ''}`}>
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
              대시보드
            </Button>
          </Link>
        </div>
      </div>

      {/* 에러 내용 */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {errorContent.icon}
          </div>
          <CardTitle className="text-2xl mb-2">
            {errorContent.title}
          </CardTitle>
          <CardDescription className="text-base">
            {errorContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {errorContent.message}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/notes">
              <Button className="w-full sm:w-auto">
                노트 목록 보기
              </Button>
            </Link>
            <Link href="/notes/new">
              <Button variant="outline" className="w-full sm:w-auto">
                새 노트 작성
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
