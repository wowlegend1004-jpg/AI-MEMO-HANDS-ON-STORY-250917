// components/ai/error-display.tsx
// AI 처리 에러 상태를 표시하는 컴포넌트
// 재시도 기능, 에러 메시지 분류, 접근성 고려
// 관련 파일: components/ai/ai-status-indicator.tsx, lib/ai/types.ts

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, X, Info } from 'lucide-react'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  retryCount?: number
  maxRetries?: number
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3,
  className,
  variant = 'default'
}: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const canRetry = onRetry && retryCount < maxRetries
  const isMaxRetries = retryCount >= maxRetries

  // 에러 메시지 분류
  const getErrorType = (error: string) => {
    if (error.includes('시간 초과') || error.includes('타임아웃')) {
      return { type: 'timeout', icon: '⏱️', color: 'text-orange-600' }
    }
    if (error.includes('네트워크') || error.includes('연결')) {
      return { type: 'network', icon: '🌐', color: 'text-blue-600' }
    }
    if (error.includes('권한') || error.includes('인증')) {
      return { type: 'auth', icon: '🔒', color: 'text-red-600' }
    }
    if (error.includes('할당량') || error.includes('제한')) {
      return { type: 'quota', icon: '📊', color: 'text-purple-600' }
    }
    return { type: 'general', icon: '⚠️', color: 'text-red-600' }
  }

  const errorType = getErrorType(error)

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400 truncate">
          {error}
        </span>
        {canRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <span className="text-sm text-red-600 dark:text-red-400">
          {error}
        </span>
        {canRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {isRetrying ? '재시도 중...' : '다시 시도'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        {/* 에러 아이콘 */}
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>

        {/* 에러 컨텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {/* 에러 메시지 */}
            <div className="flex items-start space-x-2">
              <span className="text-lg" role="img" aria-label="에러 타입">
                {errorType.icon}
              </span>
              <p className={cn('text-sm font-medium', errorType.color)}>
                {error}
              </p>
            </div>

            {/* 재시도 정보 */}
            {retryCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                재시도 횟수: {retryCount}/{maxRetries}
              </p>
            )}

            {/* 액션 버튼들 */}
            <div className="flex items-center space-x-2">
              {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="text-xs"
                >
                  <RefreshCw className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')} />
                  {isRetrying ? '재시도 중...' : '다시 시도'}
                </Button>
              )}

              {isMaxRetries && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="h-3 w-3" />
                  <span>최대 재시도 횟수를 초과했습니다.</span>
                </div>
              )}

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 성공 상태 표시 컴포넌트
interface SuccessDisplayProps {
  message: string
  onDismiss?: () => void
  className?: string
  variant?: 'default' | 'compact' | 'inline'
}

export function SuccessDisplay({
  message,
  onDismiss,
  className,
  variant = 'default'
}: SuccessDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-green-600 dark:text-green-400">
          {message}
        </span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('text-sm text-green-600 dark:text-green-400', className)}>
        {message}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-3">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          {message}
        </p>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-auto text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
