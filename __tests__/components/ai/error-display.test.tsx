// __tests__/components/ai/error-display.test.tsx
// 에러 표시 컴포넌트 테스트
// 에러 메시지 표시, 재시도 기능, 접근성 검증
// 관련 파일: components/ai/error-display.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorDisplay, SuccessDisplay } from '@/components/ai/error-display'

describe('ErrorDisplay', () => {
  const defaultProps = {
    error: 'Test error message',
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
    retryCount: 0,
    maxRetries: 3,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Default variant', () => {
    it('should render error message', () => {
      render(<ErrorDisplay {...defaultProps} />)
      
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should show retry button when onRetry is provided', () => {
      render(<ErrorDisplay {...defaultProps} />)
      
      const retryButton = screen.getByText('다시 시도')
      expect(retryButton).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn()
      render(<ErrorDisplay {...defaultProps} onRetry={onRetry} />)
      
      const retryButton = screen.getByText('다시 시도')
      fireEvent.click(retryButton)
      
      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1)
      })
    })

    it('should show retry count when retryCount > 0', () => {
      render(<ErrorDisplay {...defaultProps} retryCount={2} />)
      
      expect(screen.getByText('재시도 횟수: 2/3')).toBeInTheDocument()
    })

    it('should show max retries message when retryCount >= maxRetries', () => {
      render(<ErrorDisplay {...defaultProps} retryCount={3} maxRetries={3} />)
      
      expect(screen.getByText('최대 재시도 횟수를 초과했습니다.')).toBeInTheDocument()
    })

    it('should show dismiss button when onDismiss is provided', () => {
      render(<ErrorDisplay {...defaultProps} onDismiss={jest.fn()} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      expect(dismissButton).toBeInTheDocument()
    })

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn()
      render(<ErrorDisplay {...defaultProps} onDismiss={onDismiss} />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      fireEvent.click(dismissButton)
      
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should disable retry button when retrying', async () => {
      const onRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<ErrorDisplay {...defaultProps} onRetry={onRetry} />)
      
      const retryButton = screen.getByText('다시 시도')
      fireEvent.click(retryButton)
      
      expect(screen.getByText('재시도 중...')).toBeInTheDocument()
      expect(retryButton).toBeDisabled()
    })
  })

  describe('Compact variant', () => {
    it('should render compact error display', () => {
      render(<ErrorDisplay {...defaultProps} variant="compact" />)
      
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
    })

    it('should show retry button as small button', () => {
      render(<ErrorDisplay {...defaultProps} variant="compact" />)
      
      const retryButton = screen.getByRole('button')
      expect(retryButton).toHaveClass('h-6', 'px-2', 'text-xs')
    })
  })

  describe('Inline variant', () => {
    it('should render inline error display', () => {
      render(<ErrorDisplay {...defaultProps} variant="inline" />)
      
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
    })

    it('should show retry as text link', () => {
      render(<ErrorDisplay {...defaultProps} variant="inline" />)
      
      const retryLink = screen.getByText('다시 시도')
      expect(retryLink).toHaveClass('underline')
    })
  })

  describe('Error type classification', () => {
    it('should show timeout icon for timeout errors', () => {
      render(<ErrorDisplay {...defaultProps} error="요청 시간이 초과되었습니다." />)
      
      expect(screen.getByText('⏱️')).toBeInTheDocument()
    })

    it('should show network icon for network errors', () => {
      render(<ErrorDisplay {...defaultProps} error="네트워크 연결에 문제가 있습니다." />)
      
      expect(screen.getByText('🌐')).toBeInTheDocument()
    })

    it('should show auth icon for auth errors', () => {
      render(<ErrorDisplay {...defaultProps} error="권한이 없습니다." />)
      
      expect(screen.getByText('🔒')).toBeInTheDocument()
    })

    it('should show quota icon for quota errors', () => {
      render(<ErrorDisplay {...defaultProps} error="할당량을 초과했습니다." />)
      
      expect(screen.getByText('📊')).toBeInTheDocument()
    })

    it('should show general icon for unknown errors', () => {
      render(<ErrorDisplay {...defaultProps} error="알 수 없는 오류" />)
      
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ErrorDisplay {...defaultProps} />)
      
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })

    it('should have proper button labels', () => {
      render(<ErrorDisplay {...defaultProps} />)
      
      const retryButton = screen.getByText('다시 시도')
      expect(retryButton).toBeInTheDocument()
    })
  })
})

describe('SuccessDisplay', () => {
  const defaultProps = {
    message: 'Success message',
    onDismiss: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Default variant', () => {
    it('should render success message', () => {
      render(<SuccessDisplay {...defaultProps} />)
      
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should show dismiss button when onDismiss is provided', () => {
      render(<SuccessDisplay {...defaultProps} />)
      
      const dismissButton = screen.getByRole('button')
      expect(dismissButton).toBeInTheDocument()
    })

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn()
      render(<SuccessDisplay {...defaultProps} onDismiss={onDismiss} />)
      
      const dismissButton = screen.getByRole('button')
      fireEvent.click(dismissButton)
      
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('Compact variant', () => {
    it('should render compact success display', () => {
      render(<SuccessDisplay {...defaultProps} variant="compact" />)
      
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Green dot
    })
  })

  describe('Inline variant', () => {
    it('should render inline success display', () => {
      render(<SuccessDisplay {...defaultProps} variant="inline" />)
      
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SuccessDisplay {...defaultProps} />)
      
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-live', 'polite')
    })
  })
})