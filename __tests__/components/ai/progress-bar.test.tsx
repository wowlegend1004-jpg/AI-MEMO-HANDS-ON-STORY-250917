// __tests__/components/ai/progress-bar.test.tsx
// 프로그레스 바 컴포넌트 테스트
// ProgressBar, SpinnerProgress, StepProgress 컴포넌트의 렌더링 및 접근성 테스트
// 관련 파일: components/ai/progress-bar.tsx

import { render, screen } from '@testing-library/react'
import { ProgressBar, SpinnerProgress, StepProgress } from '@/components/ai/progress-bar'

describe('ProgressBar', () => {
  it('기본 프로그레스 바가 올바르게 렌더링되어야 한다', () => {
    render(<ProgressBar progress={50} message="진행 중" />)
    
    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('진행률이 0-100 범위로 제한되어야 한다', () => {
    const { rerender } = render(<ProgressBar progress={150} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    
    rerender(<ProgressBar progress={-10} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('퍼센트 표시를 숨길 수 있어야 한다', () => {
    render(<ProgressBar progress={50} showPercentage={false} />)
    
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('애니메이션을 비활성화할 수 있어야 한다', () => {
    const { container } = render(
      <ProgressBar progress={50} animated={false} />
    )
    
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toHaveClass('animate-pulse')
  })

  it('접근성 속성이 올바르게 설정되어야 한다', () => {
    render(<ProgressBar progress={75} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    expect(progressBar).toHaveAttribute('aria-label', '진행률 75%')
  })

  it('커스텀 클래스명이 적용되어야 한다', () => {
    const { container } = render(
      <ProgressBar progress={50} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('SpinnerProgress', () => {
  it('기본 스피너가 올바르게 렌더링되어야 한다', () => {
    render(<SpinnerProgress message="로딩 중" />)
    
    expect(screen.getByText('로딩 중')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('다양한 크기가 올바르게 렌더링되어야 한다', () => {
    const { rerender } = render(<SpinnerProgress size="sm" />)
    let spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4')
    
    rerender(<SpinnerProgress size="md" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-6', 'w-6')
    
    rerender(<SpinnerProgress size="lg" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('메시지 없이 렌더링되어야 한다', () => {
    render(<SpinnerProgress />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('로딩 중')).not.toBeInTheDocument()
  })

  it('접근성 라벨이 설정되어야 한다', () => {
    render(<SpinnerProgress />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', '로딩 중')
  })
})

describe('StepProgress', () => {
  const stepLabels = ['시작', '진행', '완료']

  it('단계별 진행률이 올바르게 렌더링되어야 한다', () => {
    render(
      <StepProgress 
        currentStep={1} 
        totalSteps={3} 
        stepLabels={stepLabels} 
      />
    )
    
    expect(screen.getByText('시작')).toBeInTheDocument()
    expect(screen.getByText('진행')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('현재 단계가 올바르게 강조되어야 한다', () => {
    render(
      <StepProgress 
        currentStep={1} 
        totalSteps={3} 
        stepLabels={stepLabels} 
      />
    )
    
    const currentStep = screen.getByText('진행')
    expect(currentStep).toHaveClass('text-blue-600')
  })

  it('완료된 단계가 올바르게 표시되어야 한다', () => {
    render(
      <StepProgress 
        currentStep={2} 
        totalSteps={3} 
        stepLabels={stepLabels} 
      />
    )
    
    const completedStep = screen.getByText('시작')
    expect(completedStep).toHaveClass('text-blue-600')
  })

  it('미완료 단계가 회색으로 표시되어야 한다', () => {
    render(
      <StepProgress 
        currentStep={0} 
        totalSteps={3} 
        stepLabels={stepLabels} 
      />
    )
    
    const futureStep = screen.getByText('완료')
    expect(futureStep).toHaveClass('text-gray-400')
  })

  it('진행률이 올바르게 계산되어야 한다', () => {
    render(
      <StepProgress 
        currentStep={1} 
        totalSteps={3} 
        stepLabels={stepLabels} 
      />
    )
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '33.333333333333336')
  })

  it('커스텀 클래스명이 적용되어야 한다', () => {
    const { container } = render(
      <StepProgress 
        currentStep={1} 
        totalSteps={3} 
        stepLabels={stepLabels} 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
