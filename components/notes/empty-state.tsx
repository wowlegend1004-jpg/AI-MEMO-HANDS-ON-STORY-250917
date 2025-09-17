// components/notes/empty-state.tsx
// 노트가 없을 때 표시되는 빈 상태 UI 컴포넌트
// 사용자에게 첫 노트 작성을 유도하는 친화적인 인터페이스 제공
// 관련 파일: app/notes/page.tsx, components/ui/button.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PenTool, Plus } from 'lucide-react'

export function EmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <PenTool className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              아직 작성된 노트가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              첫 번째 노트를 작성하여 아이디어와 생각을 정리해보세요.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/notes/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                새 노트 작성
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                대시보드로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
