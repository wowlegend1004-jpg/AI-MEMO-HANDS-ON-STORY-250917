// components/ai/ai-status-indicator.tsx
// AI 처리 상태를 통합적으로 표시하는 컴포넌트
// 로딩, 성공, 에러 상태를 모두 처리하는 통합 UI
// 관련 파일: components/ai/progress-bar.tsx, components/ai/loading-overlay.tsx, lib/ai/types.ts, lib/ai/error-handler.ts

'use client'

import { AIProcessStatus } from '@/lib/ai/types'
import { cn } from '@/lib/utils'
import { ProgressBar, SpinnerProgress } from './progress-bar'
import { RetryButton } from './retry-button'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface AIStatusIndicatorProps {
  status: AIProcessStatus
  progress?: number
  message?: string
  error?: unknown
  onRetry?: () => void
  className?: string
  showIcon?: boolean
  compact?: boolean
  retryCount?: number
  maxRetries?: number
  showRetryButton?: boolean
}

export function AIStatusIndicator({
  status,
  progress = 0,
  message,
  error,
  onRetry,
  className,
  showIcon = true,
  compact = false,
  retryCount = 0,
  maxRetries = 3,
  showRetryButton = true
}: AIStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Clock,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200'
        }
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200'
        }
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200'
        }
      case 'timeout':
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-200'
        }
      default:
        return {
          icon: null,
          iconColor: '',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {showIcon && Icon && (
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        )}
        
        {status === 'loading' ? (
          <SpinnerProgress message={message} size="sm" />
        ) : (
          <span className={cn('text-sm', config.textColor)}>
            {message || (typeof error === 'string' ? error : (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '알 수 없는 오류가 발생했습니다.'))}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        config.bgColor,
        config.borderColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {/* 아이콘 */}
        {showIcon && Icon && (
          <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        )}

        {/* 컨텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 메시지 */}
          <div className="space-y-2">
            <p className={cn('text-sm font-medium', config.textColor)}>
              {message || (typeof error === 'string' ? error : (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '알 수 없는 오류가 발생했습니다.'))}
            </p>

            {/* 진행률 바 (로딩 중일 때만) */}
            {status === 'loading' && progress !== undefined && (
              <ProgressBar
                progress={progress}
                showPercentage={true}
                animated={true}
                className="mt-2"
              />
            )}

            {/* 재시도 버튼 (에러 상태일 때) */}
            {status === 'error' && onRetry && showRetryButton && (
              <div className="mt-2">
                <RetryButton
                  onRetry={onRetry}
                  currentRetries={retryCount}
                  maxRetries={maxRetries}
                  error={typeof error === 'string' ? error : (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '알 수 없는 오류가 발생했습니다.')}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 상태별 전용 컴포넌트들
export function LoadingStatus({
  message = 'AI 처리를 진행 중입니다...',
  progress,
  className
}: {
  message?: string
  progress?: number
  className?: string
}) {
  return (
    <AIStatusIndicator
      status="loading"
      message={message}
      progress={progress}
      className={className}
    />
  )
}

export function SuccessStatus({
  message = '처리가 완료되었습니다.',
  className
}: {
  message?: string
  className?: string
}) {
  return (
    <AIStatusIndicator
      status="success"
      message={message}
      className={className}
    />
  )
}

export function ErrorStatus({
  error,
  onRetry,
  className
}: {
  error: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <AIStatusIndicator
      status="error"
      error={error}
      onRetry={onRetry}
      className={className}
    />
  )
}

export function TimeoutStatus({
  message = '처리 시간이 초과되었습니다.',
  onRetry,
  className
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <AIStatusIndicator
      status="timeout"
      message={message}
      onRetry={onRetry}
      className={className}
    />
  )
}
