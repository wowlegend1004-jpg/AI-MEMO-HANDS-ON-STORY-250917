// components/notes/tag-display.tsx
// 태그 표시 컴포넌트
// 노트의 태그를 표시하고 관리하는 UI 컴포넌트
// 관련 파일: components/notes/tag-generator.tsx, lib/ai/tag-actions.ts

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Tag, X, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { regenerateTags, deleteTags } from '@/lib/ai/tag-actions'

interface TagDisplayProps {
  noteId: string
  tags?: string[]
  isLoading?: boolean
  onRegenerate?: () => void
  onDelete?: () => void
  onEditStart?: () => void
  disabled?: boolean
}

export function TagDisplay({ 
  noteId, 
  tags = [], 
  isLoading = false,
  onRegenerate,
  onDelete,
  onEditStart,
  disabled = false
}: TagDisplayProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRegenerate = async () => {
    if (isRegenerating) return
    
    setIsRegenerating(true)
    try {
      await regenerateTags(noteId)
      onRegenerate?.()
    } catch (error) {
      console.error('태그 재생성 실패:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    
    setIsDeleting(true)
    try {
      await deleteTags(noteId)
      onDelete?.()
    } catch (error) {
      console.error('태그 삭제 실패:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            태그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            태그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">태그가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            태그 ({tags.length})
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditStart}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={disabled || isRegenerating || isDeleting}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge 
              key={`${tag}-${index}`} 
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
