// components/ai/loading-overlay.tsx
// AI 처리 중 전체 화면 로딩 오버레이 컴포넌트
// 모바일 반응형 디자인 및 접근성 고려
// 관련 파일: components/ai/progress-bar.tsx, lib/ai/types.ts

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ProgressBar, SpinnerProgress } from './progress-bar'

interface LoadingOverlayProps {
  isVisible: boolean
  progress?: number
  message?: string
  timeout?: number
  onTimeout?: () => void
  className?: string
}

export function LoadingOverlay({
  isVisible,
  progress = 0,
  message = 'AI 처리를 진행 중입니다...',
  timeout = 10000,
  onTimeout,
  className
}: LoadingOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // 타임아웃 카운트다운
  useEffect(() => {
    if (!isVisible || !timeout) {
      setTimeRemaining(null)
      return
    }

    setTimeRemaining(timeout)
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1000) {
          onTimeout?.()
          return null
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, timeout, onTimeout])

  if (!isVisible) return null

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}초`
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
    >
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* 제목 */}
        <h2 id="loading-title" className="sr-only">
          AI 처리 중
        </h2>

        {/* 로딩 컨텐츠 */}
        <div className="space-y-4">
          {/* 스피너 */}
          <div className="flex justify-center">
            <SpinnerProgress size="lg" />
          </div>

          {/* 메시지 */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
          </div>

          {/* 진행률 바 */}
          {progress !== undefined && (
            <ProgressBar
              progress={progress}
              showPercentage={true}
              animated={true}
            />
          )}

          {/* 타임아웃 표시 */}
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                예상 시간: {formatTime(timeRemaining)}
              </p>
            </div>
          )}
        </div>

        {/* 접근성 안내 */}
        <div className="sr-only" aria-live="polite">
          AI 처리가 진행 중입니다. 잠시만 기다려주세요.
        </div>
      </div>
    </div>
  )
}

// 인라인 로딩 컴포넌트 (오버레이가 아닌 인라인)
interface InlineLoadingProps {
  message?: string
  progress?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InlineLoading({
  message = '처리 중...',
  progress,
  size = 'md',
  className
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <SpinnerProgress message={message} size={size} />
      
      {progress !== undefined && (
        <div className="flex-1">
          <ProgressBar
            progress={progress}
            showPercentage={true}
            animated={true}
          />
        </div>
      )}
    </div>
  )
}

// 컴팩트 로딩 컴포넌트 (버튼 내부 등)
interface CompactLoadingProps {
  message?: string
  className?: string
}

export function CompactLoading({
  message = '처리 중...',
  className
}: CompactLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        role="status"
        aria-label="로딩 중"
      />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {message}
      </span>
    </div>
  )
}
