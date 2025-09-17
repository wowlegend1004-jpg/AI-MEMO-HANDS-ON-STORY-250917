// components/ai/error-status-indicator.tsx
// AI 처리 상태와 에러를 통합 표시하는 컴포넌트
// 로딩, 성공, 에러 상태를 시각적으로 구분하여 표시
// 관련 파일: components/ai/error-display.tsx, components/ai/retry-button.tsx, lib/ai/error-handler.ts

'use client'

import { cn } from '@/lib/utils'
import { ErrorDisplay } from './error-display'
import { RetryButton } from './retry-button'
import { AIError } from '@/lib/ai/error-handler-client'
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react'

export type AIStatus = 'idle' | 'loading' | 'error' | 'success'

interface ErrorStatusIndicatorProps {
  status: AIStatus
  error?: AIError | null
  onRetry?: () => void
  onDismiss?: () => void
  retryCount?: number
  maxRetries?: number
  loadingText?: string
  successText?: string
  className?: string
  variant?: 'default' | 'compact' | 'inline'
  showRetryButton?: boolean
  showStatusIcon?: boolean
}

export function ErrorStatusIndicator({
  status,
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3,
  loadingText = 'AI가 처리 중입니다...',
  successText = '처리가 완료되었습니다.',
  className,
  variant = 'default',
  showRetryButton = true,
  showStatusIcon = true,
}: ErrorStatusIndicatorProps) {
  // 상태별 아이콘과 색상
  const getStatusInfo = (status: AIStatus) => {
    switch (status) {
      case 'loading':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          text: loadingText,
        }
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          text: successText,
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          text: error?.message || '오류가 발생했습니다.',
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          text: '대기 중...',
        }
    }
  }

  const statusInfo = getStatusInfo(status)
  const Icon = statusInfo.icon

  // 에러 상태인 경우 ErrorDisplay 사용
  if (status === 'error' && error) {
    return (
      <div className={className}>
        <ErrorDisplay
          error={error.message}
          onRetry={onRetry}
          onDismiss={onDismiss}
          retryCount={retryCount}
          maxRetries={maxRetries}
          variant={variant}
        />
      </div>
    )
  }

  // 컴팩트 버전
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showStatusIcon && (
          <Icon className={cn(
            'h-4 w-4',
            statusInfo.color,
            status === 'loading' && 'animate-spin'
          )} />
        )}
        <span className={cn('text-sm', statusInfo.color)}>
          {statusInfo.text}
        </span>
        {status === 'loading' && showRetryButton && onRetry && (
          <RetryButton
            onRetry={onRetry}
            loading={true}
            disabled={true}
            size="sm"
            showRetryCount={false}
            showDelay={false}
          />
        )}
      </div>
    )
  }

  // 인라인 버전
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showStatusIcon && (
          <Icon className={cn(
            'h-3 w-3',
            statusInfo.color,
            status === 'loading' && 'animate-spin'
          )} />
        )}
        <span className={cn('text-xs', statusInfo.color)}>
          {statusInfo.text}
        </span>
      </div>
    )
  }

  // 기본 버전
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
      role="status"
      aria-live={status === 'loading' ? 'polite' : 'off'}
    >
      <div className="flex items-center space-x-3">
        {/* 상태 아이콘 */}
        {showStatusIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn(
              'h-5 w-5',
              statusInfo.color,
              status === 'loading' && 'animate-spin'
            )} />
          </div>
        )}

        {/* 상태 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', statusInfo.color)}>
            {statusInfo.text}
          </p>
        </div>

        {/* 액션 버튼 */}
        {status === 'loading' && showRetryButton && onRetry && (
          <div className="flex-shrink-0">
            <RetryButton
              onRetry={onRetry}
              loading={true}
              disabled={true}
              size="sm"
              showRetryCount={false}
              showDelay={false}
            />
          </div>
        )}

        {status === 'success' && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 진행률 표시가 있는 상태 인디케이터
interface ProgressStatusIndicatorProps extends ErrorStatusIndicatorProps {
  progress?: number // 0-100
  progressText?: string
}

export function ProgressStatusIndicator({
  progress = 0,
  progressText,
  ...props
}: ProgressStatusIndicatorProps) {
  return (
    <div className="space-y-3">
      <ErrorStatusIndicator {...props} />
      
      {props.status === 'loading' && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{progressText || '진행률'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 상태별 메시지 템플릿
export const STATUS_MESSAGES = {
  loading: {
    summary: 'AI가 요약을 생성하고 있습니다...',
    tags: 'AI가 태그를 생성하고 있습니다...',
    general: 'AI가 처리 중입니다...',
  },
  success: {
    summary: '요약이 성공적으로 생성되었습니다.',
    tags: '태그가 성공적으로 생성되었습니다.',
    general: '처리가 완료되었습니다.',
  },
  error: {
    network: '네트워크 연결에 문제가 있습니다.',
    timeout: '처리 시간이 초과되었습니다.',
    quota: 'API 사용량 한도를 초과했습니다.',
    general: '오류가 발생했습니다.',
  },
} as const
