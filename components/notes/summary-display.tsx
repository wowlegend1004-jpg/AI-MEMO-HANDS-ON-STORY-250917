// components/notes/summary-display.tsx
// 요약 표시 컴포넌트
// 노트의 AI 생성 요약을 불릿 포인트 형태로 표시하고 재생성 기능을 제공
// 관련 파일: components/ui/card.tsx, lib/ai/summary-actions.ts

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { regenerateSummary, deleteSummary } from '@/lib/ai/summary-actions'
import { parseSummaryBulletPoints } from '@/lib/ai/summary-utils'
import { RefreshCw, Trash2, Sparkles, AlertCircle, Edit2 } from 'lucide-react'

interface SummaryDisplayProps {
  noteId: string
  summary?: string
  isLoading?: boolean
  onSummaryChange?: (summary: string | null) => void
  onEditStart?: () => void
  disabled?: boolean
}

export function SummaryDisplay({ 
  noteId, 
  summary, 
  isLoading = false, 
  onSummaryChange,
  onEditStart,
  disabled = false
}: SummaryDisplayProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true)
      setError(null)
      
      const result = await regenerateSummary(noteId)
      
      if (result.success && result.summary) {
        onSummaryChange?.(result.summary)
      } else {
        setError(result.error || '요약 재생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 재생성 오류:', error)
      setError('요약 재생성 중 오류가 발생했습니다.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      
      const result = await deleteSummary(noteId)
      
      if (result.success) {
        onSummaryChange?.(null)
      } else {
        setError(result.error || '요약 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('요약 삭제 오류:', error)
      setError('요약 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>요약을 생성하고 있습니다...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 요약이 없는 경우
  if (!summary) {
    return null
  }

  // 요약 내용을 불릿 포인트로 파싱
  const bulletPoints = parseSummaryBulletPoints(summary)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI 요약
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditStart}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="space-y-2">
          {bulletPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
        
        {(isRegenerating || isDeleting) && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>
              {isRegenerating ? '요약을 재생성하고 있습니다...' : '요약을 삭제하고 있습니다...'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
