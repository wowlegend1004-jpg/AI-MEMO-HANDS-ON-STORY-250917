// components/notes/summary-generator.tsx
// 요약 생성 버튼 컴포넌트
// 노트 내용을 기반으로 AI 요약을 생성하는 버튼과 상태 표시를 제공
// 관련 파일: components/ui/button.tsx, lib/ai/summary-actions.ts, components/ai/ai-status-indicator.tsx, lib/ai/error-handler.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateSummaryWithErrorHandling } from '@/lib/ai/actions'
import { validateNoteContent } from '@/lib/ai/summary-utils'
import { useAIStatus } from '@/hooks/use-ai-status'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { AIStatusIndicator } from '@/components/ai/ai-status-indicator'
import { ErrorStatusIndicator } from '@/components/ai/error-status-indicator'
import { Sparkles, CheckCircle } from 'lucide-react'

interface SummaryGeneratorProps {
  noteId: string
  content: string
  userId: string
  onSummaryGenerated?: (summary: string) => void
  disabled?: boolean
}

export function SummaryGenerator({ 
  noteId, 
  content, 
  userId,
  onSummaryGenerated,
  disabled = false 
}: SummaryGeneratorProps) {
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
    type: 'summary',
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

  const handleGenerate = async () => {
    if (!canStart) return

    // 노트 내용 길이 검증
    const validation = validateNoteContent(content)
    if (!validation.isValid) {
      setError({
        type: 'VALIDATION_ERROR',
        message: validation.reason || '노트 내용이 너무 짧습니다.',
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

    // 에러 핸들링과 함께 요약 생성
    const result = await executeWithErrorHandling(
      async () => {
        const summaryResult = await generateSummaryWithErrorHandling(
          noteId,
          content,
          userId
        )

        if (summaryResult.success && summaryResult.summary) {
          onSummaryGenerated?.(summaryResult.summary)
          return summaryResult.summary
        } else {
          throw summaryResult.error || new Error('요약 생성에 실패했습니다.')
        }
      },
      { noteId, action: 'generate_summary' }
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
  const validation = validateNoteContent(content)
  const canGenerate = validation.isValid && !disabled && canStart && !isRetrying

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full sm:w-auto"
        variant={success ? "default" : "outline"}
      >
        {isProcessing || isRetrying ? (
          <>
            <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
            {isRetrying ? '재시도 중...' : '요약 생성 중...'}
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            요약 생성 완료
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            AI 요약 생성
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

      {!validation.isValid && !hasError && state.status === 'idle' && (
        <p className="text-xs text-muted-foreground">
          {validation.reason}
        </p>
      )}

      {success && state.status === 'idle' && !hasError && (
        <p className="text-xs text-green-600">
          요약이 성공적으로 생성되었습니다.
        </p>
      )}
    </div>
  )
}
