// __tests__/components/ai/retry-button.test.tsx
// 재시도 버튼 컴포넌트 테스트
// 재시도 기능, 상태 표시, 진행률 표시 검증
// 관련 파일: components/ai/retry-button.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RetryButton, SimpleRetryButton, ProgressRetryButton } from '@/components/ai/retry-button'

describe('RetryButton', () => {
  const defaultProps = {
    onRetry: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should render retry button', () => {
      render(<RetryButton {...defaultProps} />)
      
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
    })

    it('should call onRetry when clicked', async () => {
      const onRetry = jest.fn()
      render(<RetryButton {...defaultProps} onRetry={onRetry} />)
      
      const button = screen.getByText('다시 시도')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1)
      })
    })

    it('should be disabled when disabled prop is true', () => {
      render(<RetryButton {...defaultProps} disabled={true} />)
      
      const button = screen.getByText('다시 시도')
      expect(button).toBeDisabled()
    })

    it('should show loading state when loading prop is true', () => {
      render(<RetryButton {...defaultProps} loading={true} />)
      
      expect(screen.getByText('처리 중...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Retry count display', () => {
    it('should show retry count when retryCount > 0', () => {
      render(<RetryButton {...defaultProps} retryCount={2} maxRetries={3} showRetryCount={true} />)
      
      expect(screen.getByText('다시 시도 (2/3)')).toBeInTheDocument()
    })

    it('should not show retry count when showRetryCount is false', () => {
      render(<RetryButton {...defaultProps} retryCount={2} maxRetries={3} showRetryCount={false} />)
      
      expect(screen.getByText('다시 시도')).toBeInTheDocument()
      expect(screen.queryByText('다시 시도 (2/3)')).not.toBeInTheDocument()
    })

    it('should show max retries message when retryCount >= maxRetries', () => {
      render(<RetryButton {...defaultProps} retryCount={3} maxRetries={3} />)
      
      expect(screen.getByText('재시도 불가')).toBeInTheDocument()
    })
  })

  describe('Delay display', () => {
    it('should show delay when showDelay is true and delay > 0', () => {
      render(<RetryButton {...defaultProps} delay={5000} showDelay={true} />)
      
      expect(screen.getByText('다음 재시도까지: 5초')).toBeInTheDocument()
    })

    it('should not show delay when showDelay is false', () => {
      render(<RetryButton {...defaultProps} delay={5000} showDelay={false} />)
      
      expect(screen.queryByText('다음 재시도까지:')).not.toBeInTheDocument()
    })
  })

  describe('Error display', () => {
    it('should show error message when provided', () => {
      render(<RetryButton {...defaultProps} error="Test error" />)
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })

  describe('Button variants', () => {
    it('should apply correct variant classes', () => {
      const { rerender } = render(<RetryButton {...defaultProps} variant="default" />)
      expect(screen.getByRole('button')).toHaveClass('bg-primary')

      rerender(<RetryButton {...defaultProps} variant="outline" />)
      expect(screen.getByRole('button')).toHaveClass('border')

      rerender(<RetryButton {...defaultProps} variant="ghost" />)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

      rerender(<RetryButton {...defaultProps} variant="destructive" />)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')
    })
  })

  describe('Button sizes', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(<RetryButton {...defaultProps} size="sm" />)
      expect(screen.getByRole('button')).toHaveClass('h-8', 'px-3', 'text-xs')

      rerender(<RetryButton {...defaultProps} size="md" />)
      expect(screen.getByRole('button')).toHaveClass('h-9', 'px-4', 'py-2')

      rerender(<RetryButton {...defaultProps} size="lg" />)
      expect(screen.getByRole('button')).toHaveClass('h-10', 'px-8')
    })
  })

  describe('Loading state', () => {
    it('should show spinner when loading', () => {
      render(<RetryButton {...defaultProps} loading={true} />)
      
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should show retrying text when retrying', async () => {
      const onRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<RetryButton {...defaultProps} onRetry={onRetry} />)
      
      const button = screen.getByText('다시 시도')
      fireEvent.click(button)
      
      expect(screen.getByText('재시도 중...')).toBeInTheDocument()
    })
  })
})

describe('SimpleRetryButton', () => {
  const defaultProps = {
    onRetry: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with minimal props', () => {
    render(<SimpleRetryButton {...defaultProps} />)
    
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })

  it('should not show retry count or delay by default', () => {
    render(<SimpleRetryButton {...defaultProps} />)
    
    expect(screen.queryByText('재시도 횟수:')).not.toBeInTheDocument()
    expect(screen.queryByText('다음 재시도까지:')).not.toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<SimpleRetryButton {...defaultProps} disabled={true} />)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should show loading state when loading prop is true', () => {
    render(<SimpleRetryButton {...defaultProps} loading={true} />)
    
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
  })
})

describe('ProgressRetryButton', () => {
  const defaultProps = {
    onRetry: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render progress bar when progress > 0', () => {
    render(<ProgressRetryButton {...defaultProps} progress={50} />)
    
    expect(screen.getByText('진행률')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should not render progress bar when progress is 0', () => {
    render(<ProgressRetryButton {...defaultProps} progress={0} />)
    
    expect(screen.queryByText('진행률')).not.toBeInTheDocument()
  })

  it('should show custom progress text when provided', () => {
    render(<ProgressRetryButton {...defaultProps} progress={75} progressText="업로드 중" />)
    
    expect(screen.getByText('업로드 중')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should clamp progress between 0 and 100', () => {
    const { rerender } = render(<ProgressRetryButton {...defaultProps} progress={-10} />)
    expect(screen.getByText('0%')).toBeInTheDocument()

    rerender(<ProgressRetryButton {...defaultProps} progress={150} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('should show progress bar with correct width', () => {
    render(<ProgressRetryButton {...defaultProps} progress={60} />)
    
    const progressBar = screen.getByRole('progressbar', { hidden: true })
    expect(progressBar).toHaveStyle('width: 60%')
  })
})
