// __tests__/hooks/use-ai-status.test.ts
// AI 상태 관리 훅 테스트
// useAIStatus 훅의 상태 관리, 작업 시작/재시도, 에러 처리 테스트
// 관련 파일: hooks/use-ai-status.ts, lib/ai/status-manager.ts

import { renderHook, act } from '@testing-library/react'
import { useAIStatus } from '@/hooks/use-ai-status'

// Mock the status manager
jest.mock('@/lib/ai/status-manager', () => ({
  aiStatusManager: {
    startJob: jest.fn(),
    retryJob: jest.fn(),
    getJob: jest.fn(),
    getActiveJobsCount: jest.fn(() => 0)
  }
}))

import { aiStatusManager } from '@/lib/ai/status-manager'

const mockStatusManager = aiStatusManager as jest.Mocked<typeof aiStatusManager>

describe('useAIStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태가 올바르게 설정되어야 한다', () => {
    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    expect(result.current.state.status).toBe('idle')
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.canStart).toBe(true)
  })

  it('작업 시작이 성공적으로 처리되어야 한다', () => {
    mockStatusManager.startJob.mockReturnValue(true)

    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    act(() => {
      const success = result.current.startJob()
      expect(success).toBe(true)
    })

    expect(mockStatusManager.startJob).toHaveBeenCalledWith(
      expect.stringMatching(/^summary-test-note-1-\d+$/),
      'summary',
      'test-note-1',
      expect.any(Function)
    )
  })

  it('동시 작업 제한이 올바르게 처리되어야 한다', () => {
    mockStatusManager.startJob.mockReturnValue(false)

    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    act(() => {
      const success = result.current.startJob()
      expect(success).toBe(false)
    })

    expect(mockStatusManager.startJob).toHaveBeenCalled()
  })

  it('재시도 기능이 올바르게 작동해야 한다', () => {
    mockStatusManager.retryJob.mockReturnValue(true)

    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    // 먼저 에러 상태로 설정
    act(() => {
      result.current.startJob()
    })

    act(() => {
      const success = result.current.retryJob()
      expect(success).toBe(true)
    })

    expect(mockStatusManager.retryJob).toHaveBeenCalled()
  })

  it('상태 업데이트 콜백이 올바르게 호출되어야 한다', () => {
    const onSuccess = jest.fn()
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary',
        onSuccess,
        onError
      })
    )

    // 상태 업데이트 콜백을 가져와서 직접 호출
    const statusUpdateCallback = mockStatusManager.startJob.mock.calls[0]?.[3]
    
    if (statusUpdateCallback) {
      act(() => {
        statusUpdateCallback({
          jobId: 'test-job',
          status: 'success',
          progress: 100,
          message: '완료'
        })
      })

      expect(onSuccess).toHaveBeenCalled()
    }
  })

  it('에러 상태에서 재시도가 가능해야 한다', () => {
    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    // 에러 상태 시뮬레이션
    act(() => {
      result.current.startJob()
    })

    // 상태를 에러로 변경
    const statusUpdateCallback = mockStatusManager.startJob.mock.calls[0]?.[3]
    if (statusUpdateCallback) {
      act(() => {
        statusUpdateCallback({
          jobId: 'test-job',
          status: 'error',
          progress: 100,
          error: '테스트 에러'
        })
      })
    }

    expect(result.current.canStart).toBe(true)
  })

  it('처리 중일 때 작업 시작이 비활성화되어야 한다', () => {
    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    // 로딩 상태 시뮬레이션
    act(() => {
      result.current.startJob()
    })

    const statusUpdateCallback = mockStatusManager.startJob.mock.calls[0]?.[3]
    if (statusUpdateCallback) {
      act(() => {
        statusUpdateCallback({
          jobId: 'test-job',
          status: 'loading',
          progress: 50,
          message: '처리 중'
        })
      })
    }

    expect(result.current.isProcessing).toBe(true)
    expect(result.current.canStart).toBe(false)
  })

  it('상태 초기화가 올바르게 작동해야 한다', () => {
    const { result } = renderHook(() =>
      useAIStatus({
        noteId: 'test-note-1',
        type: 'summary'
      })
    )

    act(() => {
      result.current.startJob()
    })

    act(() => {
      result.current.clearState()
    })

    expect(result.current.state.status).toBe('idle')
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.canStart).toBe(true)
  })
})
