// components/notes/edit-mode-indicator.tsx
// 편집 모드 표시 컴포넌트
// 요약/태그 편집 중일 때 시각적 피드백을 제공하는 컴포넌트
// 관련 파일: components/ui/button.tsx, components/ui/badge.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, X, AlertCircle } from 'lucide-react'

interface EditModeIndicatorProps {
  isEditing: boolean
  onSave: () => void
  onCancel: () => void
  hasChanges: boolean
  isSaving?: boolean
  error?: string | null
}

export function EditModeIndicator({
  isEditing,
  onSave,
  onCancel,
  hasChanges,
  isSaving = false,
  error = null
}: EditModeIndicatorProps) {
  if (!isEditing) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg shadow-lg p-3 min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              편집 중
            </Badge>
            {hasChanges && (
              <Badge variant="destructive" className="text-xs">
                변경됨
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded mb-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            size="sm"
          >
            <X className="h-4 w-4" />
            취소
          </Button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          {hasChanges ? '변경사항이 자동으로 저장됩니다.' : '변경사항이 없습니다.'}
        </div>
      </div>
    </div>
  )
}
