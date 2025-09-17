// lib/ai/actions.ts
// AI 서비스 서버 액션
// Next.js 서버 액션을 통한 Gemini API 호출 함수들
// 관련 파일: lib/ai/gemini-client.ts, lib/notes/actions.ts, lib/ai/status-manager.ts, lib/ai/error-handler.ts

'use server'

import { getGeminiClient } from './gemini-client'
import { GeminiError } from './errors'
import { AIProcessState } from './types'
import { AIError, classifyError, logError, getUserFriendlyMessage } from './error-handler'
import { RetryManager } from './retry-manager'

// 기본 텍스트 생성 서버 액션
export async function generateText(prompt: string): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: '프롬프트가 비어있습니다.'
      }
    }

    const client = getGeminiClient()
    const text = await client.generateText(prompt)
    
    return {
      success: true,
      text
    }
  } catch (error) {
    console.error('Text generation failed:', error)
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.message 
        : 'AI 서비스에 일시적인 문제가 발생했습니다.'
    }
  }
}

// AI 헬스체크 서버 액션
export async function checkAIHealth(): Promise<{
  success: boolean
  isHealthy: boolean
  error?: string
}> {
  try {
    const client = getGeminiClient()
    const isHealthy = await client.healthCheck()
    
    return {
      success: true,
      isHealthy
    }
  } catch (error) {
    console.error('AI health check failed:', error)
    
    return {
      success: false,
      isHealthy: false,
      error: error instanceof GeminiError 
        ? error.message 
        : 'AI 서비스 상태를 확인할 수 없습니다.'
    }
  }
}

// AI 사용량 통계 조회 서버 액션
export async function getAIUsageStats(): Promise<{
  success: boolean
  stats?: {
    totalRequests: number
    successRate: number
    averageLatency: number
    totalTokens: number
  }
  error?: string
}> {
  try {
    const client = getGeminiClient()
    const stats = client.getUsageStats()
    
    return {
      success: true,
      stats
    }
  } catch (error) {
    console.error('Failed to get AI usage stats:', error)
    
    return {
      success: false,
      error: '사용량 통계를 가져올 수 없습니다.'
    }
  }
}

// 노트 요약 생성을 위한 특화된 서버 액션
export async function generateNoteSummary(content: string): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  try {
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '노트 내용이 비어있습니다.'
      }
    }

    const prompt = `다음 노트 내용을 3-5개의 불릿 포인트로 요약해주세요. 핵심 내용만 간결하게 정리해주세요.

노트 내용:
${content}

요약:`

    const client = getGeminiClient()
    const summary = await client.generateText(prompt)
    
    return {
      success: true,
      summary
    }
  } catch (error) {
    console.error('Note summary generation failed:', error)
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.message 
        : '노트 요약 생성에 실패했습니다.'
    }
  }
}

// 노트 태그 생성을 위한 특화된 서버 액션
export async function generateNoteTags(content: string): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '노트 내용이 비어있습니다.'
      }
    }

    const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요. 
태그는 쉼표로 구분하여 한 줄로 출력해주세요.

노트 내용:
${content}

태그:`

    const client = getGeminiClient()
    const response = await client.generateText(prompt)
    
    // 응답에서 태그 추출
    const tags = response
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 6) // 최대 6개로 제한
    
    return {
      success: true,
      tags
    }
  } catch (error) {
    console.error('Note tags generation failed:', error)
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.message 
        : '노트 태그 생성에 실패했습니다.'
    }
  }
}

// 상태 관리가 통합된 AI 액션들
export async function generateSummaryWithStatus(
  noteId: string,
  content: string,
  onStatusUpdate: (status: AIProcessState) => void
): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  try {
    // 로딩 상태 시작
    onStatusUpdate({
      status: 'loading',
      progress: 0,
      message: '요약 생성을 시작합니다...'
    })

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 30,
      message: '노트 내용을 분석하고 있습니다...'
    })

    if (!content || content.trim().length === 0) {
      onStatusUpdate({
        status: 'error',
        progress: 100,
        error: '노트 내용이 비어있습니다.'
      })
      return {
        success: false,
        error: '노트 내용이 비어있습니다.'
      }
    }

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 60,
      message: 'AI가 요약을 생성하고 있습니다...'
    })

    const prompt = `다음 노트 내용을 3-5개의 불릿 포인트로 요약해주세요. 핵심 내용만 간결하게 정리해주세요.

노트 내용:
${content}

요약:`

    const client = getGeminiClient()
    const summary = await client.generateText(prompt)

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 90,
      message: '요약을 저장하고 있습니다...'
    })

    // 성공 상태
    onStatusUpdate({
      status: 'success',
      progress: 100,
      message: '요약 생성이 완료되었습니다.'
    })
    
    return {
      success: true,
      summary
    }
  } catch (error) {
    console.error('Summary generation with status failed:', error)
    
    const errorMessage = error instanceof GeminiError 
      ? error.message 
      : '요약 생성에 실패했습니다.'

    onStatusUpdate({
      status: 'error',
      progress: 100,
      error: errorMessage
    })
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

export async function generateTagsWithStatus(
  noteId: string,
  content: string,
  onStatusUpdate: (status: AIProcessState) => void
): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    // 로딩 상태 시작
    onStatusUpdate({
      status: 'loading',
      progress: 0,
      message: '태그 생성을 시작합니다...'
    })

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 30,
      message: '노트 내용을 분석하고 있습니다...'
    })

    if (!content || content.trim().length === 0) {
      onStatusUpdate({
        status: 'error',
        progress: 100,
        error: '노트 내용이 비어있습니다.'
      })
      return {
        success: false,
        error: '노트 내용이 비어있습니다.'
      }
    }

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 60,
      message: 'AI가 태그를 생성하고 있습니다...'
    })

    const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요. 
태그는 쉼표로 구분하여 한 줄로 출력해주세요.

노트 내용:
${content}

태그:`

    const client = getGeminiClient()
    const response = await client.generateText(prompt)
    
    // 응답에서 태그 추출
    const tags = response
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 6) // 최대 6개로 제한

    // 진행률 업데이트
    onStatusUpdate({
      status: 'loading',
      progress: 90,
      message: '태그를 저장하고 있습니다...'
    })

    // 성공 상태
    onStatusUpdate({
      status: 'success',
      progress: 100,
      message: '태그 생성이 완료되었습니다.'
    })
    
    return {
      success: true,
      tags
    }
  } catch (error) {
    console.error('Tags generation with status failed:', error)
    
    const errorMessage = error instanceof GeminiError 
      ? error.message 
      : '태그 생성에 실패했습니다.'

    onStatusUpdate({
      status: 'error',
      progress: 100,
      error: errorMessage
    })
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

// 에러 핸들링이 통합된 AI 액션들
export async function generateSummaryWithErrorHandling(
  noteId: string,
  content: string,
  userId: string,
  onStatusUpdate?: (status: AIProcessState) => void
): Promise<{
  success: boolean
  summary?: string
  error?: AIError
  retryable?: boolean
}> {
  const context = {
    noteId,
    userId,
    action: 'generate_summary',
    timestamp: new Date(),
  }

  try {
    onStatusUpdate?.({
      status: 'loading',
      progress: 0,
      message: '요약 생성을 시작합니다...'
    })

    if (!content || content.trim().length === 0) {
      const error: AIError = {
        type: 'VALIDATION_ERROR',
        message: '노트 내용이 비어있습니다.',
        retryable: false,
        severity: 'low',
        context,
      }
      
      onStatusUpdate?.({
        status: 'error',
        progress: 100,
        error: error.message
      })
      
      return { success: false, error, retryable: false }
    }

    onStatusUpdate?.({
      status: 'loading',
      progress: 30,
      message: '노트 내용을 분석하고 있습니다...'
    })

    const prompt = `다음 노트 내용을 3-5개의 불릿 포인트로 요약해주세요. 핵심 내용만 간결하게 정리해주세요.

노트 내용:
${content}

요약:`

    const client = getGeminiClient()
    const summary = await client.generateText(prompt)

    onStatusUpdate?.({
      status: 'loading',
      progress: 90,
      message: '요약을 저장하고 있습니다...'
    })

    onStatusUpdate?.({
      status: 'success',
      progress: 100,
      message: '요약 생성이 완료되었습니다.'
    })
    
    return { success: true, summary }
  } catch (error) {
    console.error('Summary generation with error handling failed:', error)
    
    const aiError = classifyError(error, context)
    await logError(aiError, userId)

    onStatusUpdate?.({
      status: 'error',
      progress: 100,
      error: getUserFriendlyMessage(aiError)
    })
    
    return { 
      success: false, 
      error: aiError,
      retryable: aiError.retryable
    }
  }
}

export async function generateTagsWithErrorHandling(
  noteId: string,
  content: string,
  userId: string,
  onStatusUpdate?: (status: AIProcessState) => void
): Promise<{
  success: boolean
  tags?: string[]
  error?: AIError
  retryable?: boolean
}> {
  const context = {
    noteId,
    userId,
    action: 'generate_tags',
    timestamp: new Date(),
  }

  try {
    onStatusUpdate?.({
      status: 'loading',
      progress: 0,
      message: '태그 생성을 시작합니다...'
    })

    if (!content || content.trim().length === 0) {
      const error: AIError = {
        type: 'VALIDATION_ERROR',
        message: '노트 내용이 비어있습니다.',
        retryable: false,
        severity: 'low',
        context,
      }
      
      onStatusUpdate?.({
        status: 'error',
        progress: 100,
        error: error.message
      })
      
      return { success: false, error, retryable: false }
    }

    onStatusUpdate?.({
      status: 'loading',
      progress: 30,
      message: '노트 내용을 분석하고 있습니다...'
    })

    const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요. 
태그는 쉼표로 구분하여 한 줄로 출력해주세요.

노트 내용:
${content}

태그:`

    const client = getGeminiClient()
    const response = await client.generateText(prompt)
    
    const tags = response
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 6)

    onStatusUpdate?.({
      status: 'loading',
      progress: 90,
      message: '태그를 저장하고 있습니다...'
    })

    onStatusUpdate?.({
      status: 'success',
      progress: 100,
      message: '태그 생성이 완료되었습니다.'
    })
    
    return { success: true, tags }
  } catch (error) {
    console.error('Tags generation with error handling failed:', error)
    
    const aiError = classifyError(error, context)
    await logError(aiError, userId)

    onStatusUpdate?.({
      status: 'error',
      progress: 100,
      error: getUserFriendlyMessage(aiError)
    })
    
    return { 
      success: false, 
      error: aiError,
      retryable: aiError.retryable
    }
  }
}

// 재시도 로직이 포함된 AI 액션
export async function generateWithRetry<T>(
  operation: () => Promise<T>,
  userId: string,
  context?: { noteId?: string; action?: string }
): Promise<{
  success: boolean
  data?: T
  error?: AIError
  attempts: number
}> {
  const retryManager = new RetryManager()
  const operationContext = {
    ...context,
    userId,
    timestamp: new Date(),
  }

  try {
    const result = await retryManager.executeWithRetry(operation, {
      onRetry: async (attempt, error) => {
        const aiError = classifyError(error, operationContext)
        await logError(aiError, userId)
      },
      onFailure: async (error) => {
        const aiError = classifyError(error, operationContext)
        await logError(aiError, userId)
      },
    })

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      attempts: result.attempts,
    }
  } catch (error) {
    const aiError = classifyError(error, operationContext)
    await logError(aiError, userId)
    
    return {
      success: false,
      error: aiError,
      attempts: 1,
    }
  }
}
