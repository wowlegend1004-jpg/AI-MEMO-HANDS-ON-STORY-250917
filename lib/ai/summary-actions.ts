// lib/ai/summary-actions.ts
// 요약 생성 관련 서버 액션
// 노트 내용을 기반으로 AI 요약을 생성하고 데이터베이스에 저장하는 서버 액션들
// 관련 파일: lib/ai/gemini-client.ts, lib/db/schema/summaries.ts, lib/notes/actions.ts

'use server'

import { db } from '@/lib/db/connection'
import { summaries, notes } from '@/lib/db/schema'
import { getGeminiClient } from './gemini-client'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eq, and, desc } from 'drizzle-orm'
import { 
  SummaryResult, 
  SummaryGenerationRequest
} from './types'
import { validateNoteContent } from './summary-utils'
import { GeminiError } from './errors'

// 기존 요약 조회
export async function getSummary(noteId: string): Promise<SummaryResult> {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 노트 소유권 확인
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 권한이 없습니다.'
      }
    }

    // 최신 요약 조회
    const [summary] = await db
      .select()
      .from(summaries)
      .where(eq(summaries.noteId, noteId))
      .orderBy(desc(summaries.createdAt))
      .limit(1)

    if (!summary) {
      return {
        success: true,
        summary: undefined,
        noteId
      }
    }

    return {
      success: true,
      summary: summary.content,
      noteId
    }
  } catch (error) {
    console.error('요약 조회 오류:', error)
    return {
      success: false,
      error: '요약을 불러올 수 없습니다.'
    }
  }
}

// 요약 생성 서버 액션
export async function generateSummary(request: SummaryGenerationRequest): Promise<SummaryResult> {
  try {
    const { noteId, content, forceRegenerate = false } = request

    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 노트 소유권 확인
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId, content: notes.content })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 권한이 없습니다.'
      }
    }

    // 노트 내용 길이 검증
    const validation = validateNoteContent(content)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason
      }
    }

    // 중복 요약 생성 방지 (강제 재생성이 아닌 경우)
    if (!forceRegenerate) {
      const [existingSummary] = await db
        .select()
        .from(summaries)
        .where(eq(summaries.noteId, noteId))
        .orderBy(desc(summaries.createdAt))
        .limit(1)

      if (existingSummary) {
        return {
          success: true,
          summary: existingSummary.content,
          noteId
        }
      }
    }

    // Gemini API를 통한 요약 생성
    const client = getGeminiClient()
    
    const prompt = `다음 노트 내용을 3-6개의 불릿 포인트로 요약해주세요. 
각 불릿 포인트는 20-50자 내외로 간결하게 작성해주세요.
핵심 내용만 정리하여 요약해주세요.

노트 내용:
${content}

요약 (불릿 포인트 형식으로 작성):`

    const summaryText = await client.generateText(prompt)

    // 요약 데이터베이스 저장
    const [newSummary] = await db
      .insert(summaries)
      .values({
        noteId,
        model: 'gemini-2.0-flash-001',
        content: summaryText
      })
      .returning()

    // 캐시 무효화
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/notes')

    return {
      success: true,
      summary: newSummary.content,
      noteId
    }
  } catch (error) {
    console.error('요약 생성 오류:', error)
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.message 
        : '요약 생성에 실패했습니다.'
    }
  }
}

// 요약 재생성 서버 액션
export async function regenerateSummary(noteId: string): Promise<SummaryResult> {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 노트 조회
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId, content: notes.content })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 권한이 없습니다.'
      }
    }

    if (!note.content) {
      return {
        success: false,
        error: '노트 내용이 비어있습니다.'
      }
    }

    // 강제 재생성으로 요약 생성
    return await generateSummary({
      noteId,
      content: note.content,
      forceRegenerate: true
    })
  } catch (error) {
    console.error('요약 재생성 오류:', error)
    
    return {
      success: false,
      error: '요약 재생성에 실패했습니다.'
    }
  }
}

// 요약 삭제 서버 액션
export async function deleteSummary(noteId: string): Promise<SummaryResult> {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 노트 소유권 확인
    const [note] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없거나 권한이 없습니다.'
      }
    }

    // 요약 삭제
    await db
      .delete(summaries)
      .where(eq(summaries.noteId, noteId))

    // 캐시 무효화
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/notes')

    return {
      success: true,
      noteId
    }
  } catch (error) {
    console.error('요약 삭제 오류:', error)
    
    return {
      success: false,
      error: '요약 삭제에 실패했습니다.'
    }
  }
}
