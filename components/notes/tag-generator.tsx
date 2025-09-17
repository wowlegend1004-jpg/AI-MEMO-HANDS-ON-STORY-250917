// components/notes/tag-generator.tsx
// 태그 생성 버튼 컴포넌트
// 노트 내용을 기반으로 AI 태그를 생성하는 버튼과 상태 표시를 제공
// 관련 파일: components/notes/tag-display.tsx, lib/ai/tag-actions.ts, components/ai/ai-status-indicator.tsx, lib/ai/error-handler.ts

'use client'

import { Button } from '@/components/ui/button'
import { Tag, Loader2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { generateTagsWithErrorHandling } from '@/lib/ai/actions'
import { useAIStatus } from '@/hooks/use-ai-status'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { AIStatusIndicator } from '@/components/ai/ai-status-indicator'
import { ErrorStatusIndicator } from '@/components/ai/error-status-indicator'

interface TagGeneratorProps {
  noteId: string
  content: string
  userId: string
  onTagsGenerated?: (tags: string[]) => void
  disabled?: boolean
}

export function TagGenerator({ 
  noteId, 
  content, 
  userId,
  onTagsGenerated,
  disabled = false 
}: TagGeneratorProps) {
  const [success, setSuccess] = useState(false)

  // 에러 핸들링 훅 사용
  const {
    hasError,
    error,
    isRetrying,
    retryCount,
    maxRetries,
    canRetry,
    setError,
    clearError,
    executeWithErrorHandling,
  } = useErrorHandler({
    maxRetries: 3,
    userId,
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const { state, isProcessing, canStart, startJob, retryJob } = useAIStatus({
    noteId,
    type: 'tags',
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (error) => {
      // error가 이미 AIError 객체인지 확인
      if (typeof error === 'object' && error !== null && 'type' in error) {
        setError(error)
      } else {
        // 문자열인 경우 AIError 객체로 변환
        setError({
          type: 'UNKNOWN_ERROR',
          message: typeof error === 'string' ? error : '알 수 없는 오류가 발생했습니다.',
          retryable: true,
          severity: 'medium',
          details: {},
          originalError: error
        })
      }
    }
  })

  const handleGenerateTags = async () => {
    if (!canStart || disabled) return

    // 노트 내용 길이 검증
    const isContentValid = content.trim().length >= 100
    if (!isContentValid) {
      setError({
        type: 'VALIDATION_ERROR',
        message: '태그 생성을 위해서는 최소 100자 이상의 내용이 필요합니다.',
        retryable: false,
        severity: 'low',
      })
      return
    }

    // AI 상태 관리 시작
    const jobStarted = startJob()
    if (!jobStarted) {
      setError({
        type: 'SERVER_ERROR',
        message: '다른 AI 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
        severity: 'medium',
      })
      return
    }

    // 에러 핸들링과 함께 태그 생성
    const result = await executeWithErrorHandling(
      async () => {
        const tagsResult = await generateTagsWithErrorHandling(
          noteId,
          content,
          userId
        )

        if (tagsResult.success && tagsResult.tags) {
          onTagsGenerated?.(tagsResult.tags)
          return tagsResult.tags
        } else {
          throw tagsResult.error || new Error('태그 생성에 실패했습니다.')
        }
      },
      { noteId, action: 'generate_tags' }
    )

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const handleRetry = async () => {
    clearError()
    retryJob()
  }

  // 노트 내용 길이 검증
  const isContentValid = content.trim().length >= 100
  const canGenerate = isContentValid && !disabled && canStart && !isRetrying

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerateTags}
        disabled={!canGenerate}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isProcessing || isRetrying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isRetrying ? '재시도 중...' : '태그 생성 중...'}
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            태그 생성 완료
          </>
        ) : (
          <>
            <Tag className="mr-2 h-4 w-4" />
            AI 태그 생성
          </>
        )}
      </Button>

      {/* AI 상태 표시 */}
      {state.status !== 'idle' && (
        <AIStatusIndicator
          status={state.status}
          progress={state.progress}
          message={state.message}
          error={state.error}
          onRetry={state.status === 'error' ? handleRetry : undefined}
          retryCount={retryCount}
          maxRetries={maxRetries}
          compact={true}
        />
      )}

      {/* 에러 핸들링 상태 표시 */}
      {hasError && error && (
        <ErrorStatusIndicator
          status="error"
          error={error}
          onRetry={canRetry ? handleRetry : undefined}
          retryCount={retryCount}
          maxRetries={maxRetries}
          variant="compact"
        />
      )}
      
      {!isContentValid && !hasError && state.status === 'idle' && (
        <p className="text-xs text-gray-500 text-center">
          태그 생성을 위해서는 최소 100자 이상의 내용이 필요합니다.
        </p>
      )}

      {success && state.status === 'idle' && !hasError && (
        <p className="text-xs text-green-600 text-center">
          태그가 성공적으로 생성되었습니다.
        </p>
      )}
    </div>
  )
}
