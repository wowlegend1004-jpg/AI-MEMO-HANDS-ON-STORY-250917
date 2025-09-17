// lib/ai/edit-actions.ts
// 편집 관련 서버 액션
// 요약 및 태그 수동 편집을 위한 서버 액션들로 권한 검증 및 데이터 유효성 검사 포함
// 관련 파일: lib/db/connection.ts, lib/db/schema/summaries.ts, lib/db/schema/note_tags.ts, lib/supabase/server.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/connection'
import { summaries } from '@/lib/db/schema/summaries'
import { noteTags } from '@/lib/db/schema/note_tags'
import { notes } from '@/lib/db/schema/notes'
import { eq, and } from 'drizzle-orm'

// 요약 수정 서버 액션
export async function updateSummary(
  noteId: string,
  summaryContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 사용자 권한 검증
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 2. 노트 소유권 확인
    const note = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (note.length === 0) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.'
      }
    }

    if (note[0].userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 수정할 권한이 없습니다.'
      }
    }

    // 3. 요약 내용 유효성 검사
    if (!summaryContent || summaryContent.trim().length === 0) {
      return {
        success: false,
        error: '요약 내용을 입력해주세요.'
      }
    }

    if (summaryContent.length > 500) {
      return {
        success: false,
        error: '요약은 최대 500자까지 입력할 수 있습니다.'
      }
    }

    // 4. 기존 요약 확인 및 업데이트/삽입
    const existingSummary = await db
      .select({ id: summaries.id })
      .from(summaries)
      .where(eq(summaries.noteId, noteId))
      .limit(1)

    const trimmedContent = summaryContent.trim()

    if (existingSummary.length > 0) {
      // 기존 요약 업데이트
      await db
        .update(summaries)
        .set({
          content: trimmedContent,
          updatedAt: new Date()
        })
        .where(eq(summaries.id, existingSummary[0].id))
    } else {
      // 새 요약 생성
      await db.insert(summaries).values({
        noteId,
        model: 'manual-edit',
        content: trimmedContent
      })
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('요약 업데이트 실패:', error)
    return {
      success: false,
      error: '요약 저장에 실패했습니다. 다시 시도해주세요.'
    }
  }
}

// 태그 수정 서버 액션
export async function updateTags(
  noteId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 사용자 권한 검증
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 2. 노트 소유권 확인
    const note = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (note.length === 0) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.'
      }
    }

    if (note[0].userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 수정할 권한이 없습니다.'
      }
    }

    // 3. 태그 유효성 검사
    if (!Array.isArray(tags)) {
      return {
        success: false,
        error: '태그는 배열 형태여야 합니다.'
      }
    }

    if (tags.length > 6) {
      return {
        success: false,
        error: '태그는 최대 6개까지 입력할 수 있습니다.'
      }
    }

    // 태그 중복 제거 및 정리
    const uniqueTags = [...new Set(tags)]
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 6) // 최대 6개로 제한

    // 4. 트랜잭션으로 기존 태그 삭제 후 새 태그 삽입
    await db.transaction(async (tx) => {
      // 기존 태그 삭제
      await tx
        .delete(noteTags)
        .where(eq(noteTags.noteId, noteId))

      // 새 태그 삽입
      if (uniqueTags.length > 0) {
        await tx.insert(noteTags).values(
          uniqueTags.map(tag => ({
            noteId,
            tag
          }))
        )
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('태그 업데이트 실패:', error)
    return {
      success: false,
      error: '태그 저장에 실패했습니다. 다시 시도해주세요.'
    }
  }
}

// 요약 삭제 서버 액션
export async function deleteSummary(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 사용자 권한 검증
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 2. 노트 소유권 확인
    const note = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (note.length === 0) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.'
      }
    }

    if (note[0].userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 수정할 권한이 없습니다.'
      }
    }

    // 3. 요약 삭제
    await db
      .delete(summaries)
      .where(eq(summaries.noteId, noteId))

    return {
      success: true
    }
  } catch (error) {
    console.error('요약 삭제 실패:', error)
    return {
      success: false,
      error: '요약 삭제에 실패했습니다. 다시 시도해주세요.'
    }
  }
}

// 태그 삭제 서버 액션
export async function deleteTags(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 사용자 권한 검증
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.'
      }
    }

    // 2. 노트 소유권 확인
    const note = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (note.length === 0) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다.'
      }
    }

    if (note[0].userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 수정할 권한이 없습니다.'
      }
    }

    // 3. 태그 삭제
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    return {
      success: true
    }
  } catch (error) {
    console.error('태그 삭제 실패:', error)
    return {
      success: false,
      error: '태그 삭제에 실패했습니다. 다시 시도해주세요.'
    }
  }
}
