// components/notes/loading-skeleton.tsx
// 노트 목록 로딩 중에 표시되는 스켈레톤 UI 컴포넌트
// 사용자에게 로딩 상태를 시각적으로 표시하여 UX 향상
// 관련 파일: app/notes/page.tsx, components/ui/card.tsx

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* 정렬 및 페이지네이션 스켈레톤 */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* 노트 카드 스켈레톤들 */}
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  )
}
