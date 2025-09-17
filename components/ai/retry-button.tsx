// components/ai/retry-button.tsx
// AI 요청 재시도 버튼 컴포넌트
// 재시도 상태 표시, 진행률 표시, 재시도 제한 관리
// 관련 파일: components/ui/button.tsx, hooks/use-retry.ts

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RefreshCw, Clock, AlertCircle } from 'lucide-react'

interface RetryButtonProps {
  onRetry: () => void
  disabled?: boolean
  loading?: boolean
  maxRetries?: number
  currentRetries?: number
  error?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
  showRetryCount?: boolean
  showDelay?: boolean
  delay?: number
}

export function RetryButton({
  onRetry,
  disabled = false,
  loading = false,
  maxRetries = 3,
  currentRetries = 0,
  error,
  variant = 'outline',
  size = 'sm',
  className,
  showRetryCount = true,
  showDelay = false,
  delay = 0,
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (disabled || loading || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const canRetry = !disabled && !loading && !isRetrying && currentRetries < maxRetries
  const isMaxRetries = currentRetries >= maxRetries
  const isActive = loading || isRetrying

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (isRetrying) return '재시도 중...'
    if (loading) return '처리 중...'
    if (isMaxRetries) return '재시도 불가'
    if (showRetryCount && currentRetries > 0) {
      return `다시 시도 (${currentRetries}/${maxRetries})`
    }
    return '다시 시도'
  }

  // 아이콘 크기 결정
  const getIconSize = () => {
    return size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  }

  // 아이콘 결정
  const getIcon = () => {
    if (isActive) {
      return <RefreshCw className={cn('animate-spin', getIconSize())} />
    }
    if (isMaxRetries) {
      return <AlertCircle className={cn(getIconSize())} />
    }
    if (showDelay && delay > 0) {
      return <Clock className={cn(getIconSize())} />
    }
    return <RefreshCw className={cn(getIconSize())} />
  }

  // 버튼 색상 결정
  const getVariant = () => {
    if (isMaxRetries) return 'destructive'
    if (isActive) return 'default'
    return variant
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={handleRetry}
        disabled={!canRetry}
        variant={getVariant()}
        size={size}
        className={cn(
          'transition-all duration-200',
          isActive && 'animate-pulse',
          className
        )}
      >
        {getIcon()}
        <span className="ml-1">{getButtonText()}</span>
      </Button>

      {/* 재시도 정보 표시 */}
      {(showRetryCount || showDelay) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {showRetryCount && currentRetries > 0 && (
            <div>시도 횟수: {currentRetries}/{maxRetries}</div>
          )}
          {showDelay && delay > 0 && (
            <div>다음 재시도까지: {Math.ceil(delay / 1000)}초</div>
          )}
          {error && (
            <div className="text-red-500 dark:text-red-400 mt-1">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 간단한 재시도 버튼 (최소한의 props)
interface SimpleRetryButtonProps {
  onRetry: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function SimpleRetryButton({
  onRetry,
  loading = false,
  disabled = false,
  className,
}: SimpleRetryButtonProps) {
  return (
    <RetryButton
      onRetry={onRetry}
      loading={loading}
      disabled={disabled}
      showRetryCount={false}
      showDelay={false}
      className={className}
    />
  )
}

// 진행률 표시가 있는 재시도 버튼
interface ProgressRetryButtonProps extends RetryButtonProps {
  progress?: number // 0-100
  progressText?: string
}

export function ProgressRetryButton({
  progress = 0,
  progressText,
  ...props
}: ProgressRetryButtonProps) {
  return (
    <div className="space-y-2">
      <RetryButton {...props} />
      
      {progress > 0 && (
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{progressText || '진행률'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
