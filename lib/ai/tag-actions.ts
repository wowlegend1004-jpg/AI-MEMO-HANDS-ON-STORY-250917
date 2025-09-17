// lib/ai/tag-actions.ts
// 태그 생성 관련 서버 액션
// 노트 내용을 기반으로 AI 태그를 생성하고 데이터베이스에 저장하는 서버 액션들
// 관련 파일: lib/ai/gemini-client.ts, lib/db/schema/note_tags.ts, lib/notes/actions.ts

'use server'

import { db } from '@/lib/db/connection'
import { noteTags, notes } from '@/lib/db/schema'
import { getGeminiClient } from './gemini-client'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eq, and, desc } from 'drizzle-orm'
import { 
  TagResult, 
  TagGenerationRequest
} from './types'
import { GeminiError } from './errors'

// 노트 내용 길이 검증 함수
function validateNoteContentForTags(content: string): { isValid: boolean; reason?: string } {
  const minLength = 100
  const currentLength = content.trim().length
  
  if (currentLength < minLength) {
    return {
      isValid: false,
      reason: `태그 생성을 위해서는 최소 ${minLength}자 이상의 내용이 필요합니다. (현재: ${currentLength}자)`
    }
  }
  
  return { isValid: true }
}

// 기존 태그 조회
export async function getTags(noteId: string): Promise<TagResult> {
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

    // 태그 목록 조회
    const tags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))
      .orderBy(desc(noteTags.createdAt))

    return {
      success: true,
      tags: tags.map(t => t.tag),
      noteId
    }
  } catch (error) {
    console.error('태그 조회 오류:', error)
    return {
      success: false,
      error: '태그를 불러올 수 없습니다.'
    }
  }
}

// 태그 생성 서버 액션
export async function generateTags(request: TagGenerationRequest): Promise<TagResult> {
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
    const validation = validateNoteContentForTags(content)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason
      }
    }

    // 중복 태그 생성 방지 (강제 재생성이 아닌 경우)
    if (!forceRegenerate) {
      const existingTags = await db
        .select({ tag: noteTags.tag })
        .from(noteTags)
        .where(eq(noteTags.noteId, noteId))
        .limit(1)

      if (existingTags.length > 0) {
        const allTags = await db
          .select({ tag: noteTags.tag })
          .from(noteTags)
          .where(eq(noteTags.noteId, noteId))
          .orderBy(desc(noteTags.createdAt))

        return {
          success: true,
          tags: allTags.map(t => t.tag),
          noteId
        }
      }
    }

    // Gemini API를 통한 태그 생성
    const client = getGeminiClient()
    
    const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요.
태그는 1-3단어로 구성하고, 쉼표로 구분하여 한 줄로 출력해주세요.
노트 내용의 핵심 키워드를 반영한 태그를 생성해주세요.

노트 내용:
${content}

태그:`

    const response = await client.generateText(prompt)

    // 응답에서 태그 추출 및 정리
    const tags = response
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 50) // 1-50자 제한
      .slice(0, 6) // 최대 6개로 제한
      .map(tag => tag.toLowerCase()) // 소문자로 정규화

    if (tags.length === 0) {
      return {
        success: false,
        error: '유효한 태그를 생성할 수 없습니다.'
      }
    }

    // 기존 태그와 중복 검사
    const existingTags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))

    const existingTagSet = new Set(existingTags.map(t => t.tag.toLowerCase()))
    const newTags = tags.filter(tag => !existingTagSet.has(tag))

    if (newTags.length === 0) {
      return {
        success: true,
        tags: existingTags.map(t => t.tag),
        noteId
      }
    }

    // 태그 데이터베이스 저장
    const tagInserts = newTags.map(tag => ({
      noteId,
      tag
    }))

    await db
      .insert(noteTags)
      .values(tagInserts)

    // 모든 태그 조회하여 반환
    const allTags = await db
      .select({ tag: noteTags.tag })
      .from(noteTags)
      .where(eq(noteTags.noteId, noteId))
      .orderBy(desc(noteTags.createdAt))

    // 캐시 무효화
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/notes')

    return {
      success: true,
      tags: allTags.map(t => t.tag),
      noteId
    }
  } catch (error) {
    console.error('태그 생성 오류:', error)
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.message 
        : '태그 생성에 실패했습니다.'
    }
  }
}

// 태그 재생성 서버 액션
export async function regenerateTags(noteId: string): Promise<TagResult> {
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

    // 기존 태그 삭제
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    // 강제 재생성으로 태그 생성
    return await generateTags({
      noteId,
      content: note.content,
      forceRegenerate: true
    })
  } catch (error) {
    console.error('태그 재생성 오류:', error)
    
    return {
      success: false,
      error: '태그 재생성에 실패했습니다.'
    }
  }
}

// 태그 삭제 서버 액션
export async function deleteTags(noteId: string): Promise<TagResult> {
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

    // 태그 삭제
    await db
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId))

    // 캐시 무효화
    revalidatePath(`/notes/${noteId}`)
    revalidatePath('/notes')

    return {
      success: true,
      noteId
    }
  } catch (error) {
    console.error('태그 삭제 오류:', error)
    
    return {
      success: false,
      error: '태그 삭제에 실패했습니다.'
    }
  }
}
