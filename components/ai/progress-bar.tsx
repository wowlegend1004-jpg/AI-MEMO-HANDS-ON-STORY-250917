// components/ai/progress-bar.tsx
// AI 처리 진행률 표시 프로그레스 바 컴포넌트
// 접근성을 고려한 진행률 표시 및 애니메이션
// 관련 파일: components/ui/progress.tsx, lib/ai/types.ts

'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number // 0-100
  message?: string
  className?: string
  showPercentage?: boolean
  animated?: boolean
}

export function ProgressBar({
  progress,
  message,
  className,
  showPercentage = true,
  animated = true
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* 진행률 바 */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn(
            'h-full bg-blue-600 transition-all duration-300 ease-out',
            animated && 'animate-pulse'
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`진행률 ${clampedProgress}%`}
        />
      </div>

      {/* 메시지와 퍼센트 표시 */}
      <div className="flex items-center justify-between text-sm">
        {message && (
          <span className="text-gray-600 dark:text-gray-400" aria-live="polite">
            {message}
          </span>
        )}
        
        {showPercentage && (
          <span className="text-gray-500 dark:text-gray-500 font-medium">
            {clampedProgress}%
          </span>
        )}
      </div>
    </div>
  )
}

// 스피너와 함께 사용하는 컴포넌트
interface SpinnerProgressProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function SpinnerProgress({
  message,
  className,
  size = 'md'
}: SpinnerProgressProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
        role="status"
        aria-label="로딩 중"
      />
      
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  )
}

// 단계별 진행률 표시 컴포넌트
interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  className
}: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* 진행률 바 */}
      <ProgressBar
        progress={progress}
        showPercentage={false}
        className="h-3"
      />

      {/* 단계 표시 */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {stepLabels.map((label, index) => (
          <span
            key={index}
            className={cn(
              'transition-colors duration-200',
              index <= currentStep
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
