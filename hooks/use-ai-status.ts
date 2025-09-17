// hooks/use-ai-status.ts
// AI 상태 관리 React 훅
// AI 작업 상태 추적, 상태 업데이트, 버튼 비활성화 로직
// 관련 파일: lib/ai/status-manager.ts, lib/ai/types.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AIProcessStatus, AIProcessState, AIStatusUpdate } from '@/lib/ai/types'
import { aiStatusManager } from '@/lib/ai/status-manager'

interface UseAIStatusOptions {
  noteId: string
  type: 'summary' | 'tags'
  maxRetries?: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UseAIStatusReturn {
  state: AIProcessState
  isProcessing: boolean
  canStart: boolean
  startJob: () => boolean
  retryJob: () => boolean
  clearState: () => void
}

export function useAIStatus({
  noteId,
  type,
  maxRetries = 3,
  onSuccess,
  onError
}: UseAIStatusOptions): UseAIStatusReturn {
  const [state, setState] = useState<AIProcessState>({
    status: 'idle',
    maxRetries
  })

  const jobIdRef = useRef<string | null>(null)
  const statusUpdateCallbackRef = useRef<(update: AIStatusUpdate) => void>(() => {})

  // 상태 업데이트 콜백
  const handleStatusUpdate = useCallback((update: AIStatusUpdate) => {
    setState(prevState => ({
      ...prevState,
      status: update.status,
      progress: update.progress,
      message: update.message,
      error: update.error,
      retryCount: update.status === 'error' ? (prevState.retryCount || 0) + 1 : prevState.retryCount
    }))

    // 성공/에러 콜백 호출
    if (update.status === 'success' && onSuccess) {
      onSuccess()
    } else if (update.status === 'error' && onError) {
      console.log('useAIStatus - Error received:', {
        error: update.error,
        errorType: typeof update.error,
        errorKeys: update.error && typeof update.error === 'object' ? Object.keys(update.error) : 'not object'
      })
      
      const errorMessage = typeof update.error === 'string' 
        ? update.error 
        : (update.error && typeof update.error === 'object' && 'message' in update.error 
          ? (update.error as { message: string }).message 
          : '알 수 없는 오류가 발생했습니다.')
      onError(errorMessage)
    }
  }, [onSuccess, onError])

  // 상태 업데이트 콜백 참조 업데이트
  useEffect(() => {
    statusUpdateCallbackRef.current = handleStatusUpdate
  }, [handleStatusUpdate])

  // 컴포넌트 언마운트 시 작업 정리
  useEffect(() => {
    return () => {
      if (jobIdRef.current) {
        // 작업이 진행 중이면 완료 처리
        const job = aiStatusManager.getJob(jobIdRef.current)
        if (job && job.status === 'loading') {
          aiStatusManager.failJob(jobIdRef.current, new Error('사용자가 페이지를 떠났습니다.'))
        }
      }
    }
  }, [])

  // 작업 시작
  const startJob = useCallback((): boolean => {
    if (state.status === 'loading') return false

    const jobId = `${type}-${noteId}-${Date.now()}`
    const success = aiStatusManager.startJob(
      jobId,
      type,
      noteId,
      handleStatusUpdate
    )

    if (success) {
      jobIdRef.current = jobId
      setState(prevState => ({
        ...prevState,
        status: 'loading',
        progress: 0,
        message: 'AI 처리를 시작합니다...',
        retryCount: 0
      }))
    }

    return success
  }, [noteId, type, state.status, handleStatusUpdate])

  // 작업 재시도
  const retryJob = useCallback((): boolean => {
    if (!jobIdRef.current || state.status !== 'error') return false

    const success = aiStatusManager.retryJob(jobIdRef.current)
    if (success) {
      setState(prevState => ({
        ...prevState,
        status: 'loading',
        progress: 0,
        message: '재시도 중...',
        error: undefined
      }))
    }

    return success
  }, [state.status])

  // 상태 초기화
  const clearState = useCallback(() => {
    if (jobIdRef.current) {
      aiStatusManager.completeJob(jobIdRef.current)
      jobIdRef.current = null
    }
    
    setState({
      status: 'idle',
      maxRetries
    })
  }, [maxRetries])

  // 처리 중 여부
  const isProcessing = state.status === 'loading'

  // 작업 시작 가능 여부
  const canStart = state.status === 'idle' || state.status === 'error'

  return {
    state,
    isProcessing,
    canStart,
    startJob,
    retryJob,
    clearState
  }
}

// 여러 AI 작업 상태를 관리하는 훅
export function useMultipleAIStatus(noteId: string) {
  const [jobs, setJobs] = useState<Map<string, AIProcessState>>(new Map())

  const addJob = useCallback((type: 'summary' | 'tags', state: AIProcessState) => {
    setJobs(prev => new Map(prev.set(type, state)))
  }, [])

  const updateJob = useCallback((type: 'summary' | 'tags', state: AIProcessState) => {
    setJobs(prev => new Map(prev.set(type, state)))
  }, [])

  const removeJob = useCallback((type: 'summary' | 'tags') => {
    setJobs(prev => {
      const newJobs = new Map(prev)
      newJobs.delete(type)
      return newJobs
    })
  }, [])

  const isAnyProcessing = Array.from(jobs.values()).some(job => job.status === 'loading')
  const hasErrors = Array.from(jobs.values()).some(job => job.status === 'error')

  return {
    jobs,
    addJob,
    updateJob,
    removeJob,
    isAnyProcessing,
    hasErrors
  }
}
