// lib/ai/status-manager.ts
// AI 처리 상태 관리 로직
// 동시 AI 작업 상태 추적, 타임아웃 처리, 상태 업데이트 관리
// 관련 파일: lib/ai/types.ts, hooks/use-ai-status.ts

import { AIJob, AIProcessStatus, AIStatusUpdate } from './types'

export class AIStatusManager {
  private jobs: Map<string, AIJob> = new Map()
  private statusUpdateCallbacks: Map<string, (update: AIStatusUpdate) => void> = new Map()
  private maxConcurrentJobs = 2
  private defaultTimeout = 10000 // 10초

  /**
   * 새로운 AI 작업을 시작합니다
   */
  startJob(
    jobId: string,
    type: 'summary' | 'tags',
    noteId: string,
    onStatusUpdate: (update: AIStatusUpdate) => void,
    timeout?: number
  ): boolean {
    // 동시 작업 수 제한 확인
    if (this.getActiveJobsCount() >= this.maxConcurrentJobs) {
      return false
    }

    // 기존 작업이 있는지 확인
    if (this.jobs.has(jobId)) {
      return false
    }

    const job: AIJob = {
      id: jobId,
      type,
      noteId,
      status: 'loading',
      startTime: Date.now(),
      timeout: timeout || this.defaultTimeout
    }

    this.jobs.set(jobId, job)
    this.statusUpdateCallbacks.set(jobId, onStatusUpdate)

    // 로딩 상태 알림
    this.updateJobStatus(jobId, 'loading', 0, 'AI 처리를 시작합니다...')

    // 타임아웃 설정
    setTimeout(() => {
      if (this.jobs.has(jobId) && this.jobs.get(jobId)?.status === 'loading') {
        this.updateJobStatus(jobId, 'timeout', 100, '처리 시간이 초과되었습니다.')
        this.completeJob(jobId)
      }
    }, job.timeout)

    return true
  }

  /**
   * 작업 상태를 업데이트합니다
   */
  updateJobStatus(
    jobId: string,
    status: AIProcessStatus,
    progress?: number,
    message?: string,
    error?: unknown
  ): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = status
    const callback = this.statusUpdateCallbacks.get(jobId)
    
    if (callback) {
      console.log('AIStatusManager - Sending update:', {
        jobId,
        status,
        progress,
        message,
        error,
        errorType: typeof error,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : 'not object'
      })
      
      callback({
        jobId,
        status,
        progress,
        message,
        error
      })
    }
  }

  /**
   * 작업을 완료합니다
   */
  completeJob(jobId: string): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    // 완료 상태로 업데이트
    this.updateJobStatus(jobId, 'success', 100, '처리가 완료되었습니다.')

    // 작업 정리
    setTimeout(() => {
      this.jobs.delete(jobId)
      this.statusUpdateCallbacks.delete(jobId)
    }, 2000) // 2초 후 정리
  }

  /**
   * 작업을 실패로 처리합니다
   */
  failJob(jobId: string, error: string | Error): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    // 에러를 AIError 형태로 변환
    const aiError = typeof error === 'string' 
      ? {
          type: 'UNKNOWN_ERROR' as const,
          message: error,
          details: {},
          retryable: false,
          severity: 'medium' as const,
          originalError: error
        }
      : {
          type: 'UNKNOWN_ERROR' as const,
          message: error.message || '알 수 없는 오류가 발생했습니다.',
          details: { stack: error.stack },
          retryable: false,
          severity: 'medium' as const,
          originalError: error
        }

    this.updateJobStatus(jobId, 'error', 100, '처리에 실패했습니다.', aiError)
    
    // 작업 정리
    setTimeout(() => {
      this.jobs.delete(jobId)
      this.statusUpdateCallbacks.delete(jobId)
    }, 5000) // 5초 후 정리
  }

  /**
   * 작업을 재시작합니다
   */
  retryJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job || job.status !== 'error') return false

    job.status = 'loading'
    job.startTime = Date.now()
    
    this.updateJobStatus(jobId, 'loading', 0, '재시도 중...')

    // 타임아웃 재설정
    setTimeout(() => {
      if (this.jobs.has(jobId) && this.jobs.get(jobId)?.status === 'loading') {
        this.updateJobStatus(jobId, 'timeout', 100, '재시도 중 처리 시간이 초과되었습니다.')
        this.completeJob(jobId)
      }
    }, job.timeout)

    return true
  }

  /**
   * 활성 작업 수를 반환합니다
   */
  getActiveJobsCount(): number {
    return Array.from(this.jobs.values()).filter(job => job.status === 'loading').length
  }

  /**
   * 특정 노트의 작업들을 반환합니다
   */
  getJobsByNoteId(noteId: string): AIJob[] {
    return Array.from(this.jobs.values()).filter(job => job.noteId === noteId)
  }

  /**
   * 특정 작업을 반환합니다
   */
  getJob(jobId: string): AIJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * 모든 작업을 정리합니다
   */
  clearAllJobs(): void {
    this.jobs.clear()
    this.statusUpdateCallbacks.clear()
  }

  /**
   * 완료된 작업들을 정리합니다
   */
  cleanupCompletedJobs(): void {
    const now = Date.now()
    const completedJobs = Array.from(this.jobs.entries()).filter(([_, job]) => 
      (job.status === 'success' || job.status === 'error' || job.status === 'timeout') &&
      (now - job.startTime) > 10000 // 10초 이상 지난 완료된 작업들
    )

    completedJobs.forEach(([jobId, _]) => {
      this.jobs.delete(jobId)
      this.statusUpdateCallbacks.delete(jobId)
    })
  }
}

// 싱글톤 인스턴스
export const aiStatusManager = new AIStatusManager()
