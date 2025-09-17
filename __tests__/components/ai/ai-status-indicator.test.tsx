// __tests__/components/ai/ai-status-indicator.test.tsx
// AI 상태 표시 컴포넌트 테스트
// AIStatusIndicator 컴포넌트의 상태별 렌더링, 재시도 기능, 접근성 테스트
// 관련 파일: components/ai/ai-status-indicator.tsx, lib/ai/types.ts

import { render, screen, fireEvent } from '@testing-library/react'
import { AIStatusIndicator } from '@/components/ai/ai-status-indicator'
import { AIProcessStatus } from '@/lib/ai/types'

describe('AIStatusIndicator', () => {
  const defaultProps = {
    status: 'idle' as AIProcessStatus,
    message: '테스트 메시지'
  }

  it('idle 상태에서 올바르게 렌더링되어야 한다', () => {
    render(<AIStatusIndicator {...defaultProps} status="idle" />)
    
    expect(screen.getByText('테스트 메시지')).toBeInTheDocument()
  })

  it('loading 상태에서 프로그레스 바가 표시되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="loading" 
        progress={50}
        message="로딩 중..."
      />
    )
    
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('success 상태에서 성공 아이콘이 표시되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="success" 
        message="완료되었습니다"
      />
    )
    
    expect(screen.getByText('완료되었습니다')).toBeInTheDocument()
    // CheckCircle 아이콘이 있는지 확인
    const successIcon = screen.getByRole('img', { hidden: true })
    expect(successIcon).toBeInTheDocument()
  })

  it('error 상태에서 에러 아이콘과 재시도 버튼이 표시되어야 한다', () => {
    const onRetry = jest.fn()
    
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="error" 
        error="에러가 발생했습니다"
        onRetry={onRetry}
      />
    )
    
    expect(screen.getByText('에러가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('다시 시도'))
    expect(onRetry).toHaveBeenCalled()
  })

  it('timeout 상태에서 타임아웃 아이콘이 표시되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="timeout" 
        message="시간 초과"
      />
    )
    
    expect(screen.getByText('시간 초과')).toBeInTheDocument()
  })

  it('compact 모드에서 올바르게 렌더링되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="loading" 
        message="로딩 중"
        compact={true}
      />
    )
    
    expect(screen.getByText('로딩 중')).toBeInTheDocument()
    // compact 모드에서는 프로그레스 바가 표시되지 않아야 함
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('아이콘 없이 렌더링되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="success" 
        message="완료"
        showIcon={false}
      />
    )
    
    expect(screen.getByText('완료')).toBeInTheDocument()
    // 아이콘이 표시되지 않아야 함
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument()
  })

  it('접근성 속성이 올바르게 설정되어야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="loading" 
        progress={75}
        message="처리 중"
      />
    )
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    expect(progressBar).toHaveAttribute('aria-label', '진행률 75%')
  })

  it('에러 상태에서 재시도 버튼이 없을 때 버튼이 표시되지 않아야 한다', () => {
    render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="error" 
        error="에러 발생"
        // onRetry prop 없음
      />
    )
    
    expect(screen.getByText('에러 발생')).toBeInTheDocument()
    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument()
  })

  it('커스텀 클래스명이 적용되어야 한다', () => {
    const { container } = render(
      <AIStatusIndicator 
        {...defaultProps} 
        status="loading" 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('LoadingStatus', () => {
  it('로딩 상태 컴포넌트가 올바르게 렌더링되어야 한다', () => {
    const { LoadingStatus } = require('@/components/ai/ai-status-indicator')
    
    render(
      <LoadingStatus 
        message="로딩 중..." 
        progress={60}
      />
    )
    
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})

describe('SuccessStatus', () => {
  it('성공 상태 컴포넌트가 올바르게 렌더링되어야 한다', () => {
    const { SuccessStatus } = require('@/components/ai/ai-status-indicator')
    
    render(
      <SuccessStatus 
        message="완료되었습니다" 
      />
    )
    
    expect(screen.getByText('완료되었습니다')).toBeInTheDocument()
  })
})

describe('ErrorStatus', () => {
  it('에러 상태 컴포넌트가 올바르게 렌더링되어야 한다', () => {
    const { ErrorStatus } = require('@/components/ai/ai-status-indicator')
    const onRetry = jest.fn()
    
    render(
      <ErrorStatus 
        error="에러 발생" 
        onRetry={onRetry}
      />
    )
    
    expect(screen.getByText('에러 발생')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })
})

describe('TimeoutStatus', () => {
  it('타임아웃 상태 컴포넌트가 올바르게 렌더링되어야 한다', () => {
    const { TimeoutStatus } = require('@/components/ai/ai-status-indicator')
    const onRetry = jest.fn()
    
    render(
      <TimeoutStatus 
        message="시간 초과" 
        onRetry={onRetry}
      />
    )
    
    expect(screen.getByText('시간 초과')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })
})
