// components/ai/error-boundary.tsx
// AI 관련 컴포넌트 에러 경계
// 예상치 못한 에러를 포착하고 사용자에게 적절한 피드백 제공
// 관련 파일: components/ai/error-display.tsx, lib/ai/error-handler.ts

'use client'

import React, { Component, ReactNode } from 'react'
import { ErrorDisplay } from './error-display'
import { AIError, classifyError } from '@/lib/ai/error-handler-client'

interface ErrorBoundaryState {
  hasError: boolean
  error: AIError | null
  errorInfo: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: AIError; reset: () => void }>
  onError?: (error: AIError, errorInfo: string) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 에러를 AIError로 변환
    const aiError = classifyError(error, {
      timestamp: new Date(),
    })

    return {
      hasError: true,
      error: aiError,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const aiError = classifyError(error, {
      timestamp: new Date(),
    })

    this.setState({
      error: aiError,
      errorInfo: errorInfo.componentStack || null,
    })

    // 에러 콜백 호출
    this.props.onError?.(aiError, errorInfo.componentStack || '')

    // 에러 로깅 (클라이언트에서는 콘솔에만 기록)
    console.error('ErrorBoundary caught an error:', {
      error: aiError,
      errorInfo: errorInfo.componentStack,
      stack: error.stack,
    })
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // props 변경 시 에러 상태 리셋
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      } else {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleRetry = () => {
    // 재시도 시 에러 상태 리셋
    this.resetErrorBoundary()
  }

  handleDismiss = () => {
    // 에러 무시 시에도 상태 리셋
    this.resetErrorBoundary()
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // 커스텀 fallback 컴포넌트가 있으면 사용
      if (fallback) {
        const FallbackComponent = fallback
        return (
          <FallbackComponent 
            error={error} 
            reset={this.resetErrorBoundary} 
          />
        )
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={error.message}
              onRetry={this.handleRetry}
              onDismiss={this.handleDismiss}
              retryCount={0}
              maxRetries={1}
              variant="default"
              className="mb-4"
            />
            
            {/* 개발 모드에서만 상세 에러 정보 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  개발자 정보 (개발 모드에서만 표시)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>에러 타입:</strong> {error.type}
                  </div>
                  <div>
                    <strong>심각도:</strong> {error.severity}
                  </div>
                  <div>
                    <strong>재시도 가능:</strong> {error.retryable ? '예' : '아니오'}
                  </div>
                  {error.details && (
                    <div>
                      <strong>상세 정보:</strong>
                      <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-auto">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

// 함수형 컴포넌트를 위한 HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 기본 에러 fallback 컴포넌트
export function DefaultErrorFallback({ error, reset }: { error: AIError; reset: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">문제가 발생했습니다</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
