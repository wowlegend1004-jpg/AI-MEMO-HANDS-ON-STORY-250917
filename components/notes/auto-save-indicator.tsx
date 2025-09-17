// components/notes/auto-save-indicator.tsx
// 자동 저장 상태 표시 컴포넌트
// 노트 편집 중 자동 저장 상태를 시각적으로 표시하는 UI 컴포넌트
// 관련 파일: components/notes/note-editor.tsx, lib/notes/actions.ts

'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSaved?: Date
  errorMessage?: string
  className?: string
}

export function AutoSaveIndicator({ 
  status, 
  lastSaved, 
  errorMessage,
  className 
}: AutoSaveIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'saved':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return '저장 중...'
      case 'saved':
        return lastSaved 
          ? `저장됨 ${lastSaved.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}`
          : '저장됨'
      case 'error':
        return errorMessage || '저장 실패'
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return 'text-blue-600'
      case 'saved':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm transition-opacity duration-200',
      status === 'idle' ? 'opacity-0' : 'opacity-100',
      className
    )}>
      {getStatusIcon()}
      <span className={cn('font-medium', getStatusColor())}>
        {getStatusText()}
      </span>
    </div>
  )
}
