// lib/notes/actions.ts
// 노트 관련 Server Actions
// 노트 생성, 수정, 삭제 등의 서버 사이드 로직을 처리
// 관련 파일: lib/db/connection.ts, lib/db/schema/notes.ts, components/notes/note-form.tsx

'use server'

import { db } from '@/lib/db/connection'
import { notes, insertNoteSchema, summaries, noteTags } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eq, desc, sql, ilike, and, or } from 'drizzle-orm'

export async function createNote(data: { title: string; content: string }) {
  try {
    console.log('노트 생성 시작:', data)
    
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('사용자 인증 결과:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    // 데이터 검증
    const validatedData = insertNoteSchema.parse({
      title: data.title || '제목 없음',
      content: data.content || '',
      userId: user.id
    })

    console.log('검증된 데이터:', validatedData)

    // 노트 생성
    console.log('데이터베이스에 노트 저장 시도...')
    const [newNote] = await db.insert(notes).values(validatedData).returning()
    console.log('노트 저장 성공:', newNote)

    // 캐시 무효화
    revalidatePath('/notes')
    
    return newNote
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('노트 생성 오류 상세:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    throw new Error(`노트 저장에 실패했습니다: ${errorMessage}`)
  }
}

export async function getNotes() {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    // 사용자의 노트 조회
    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt))

    return userNotes
  } catch (error) {
    console.error('노트 조회 오류:', error)
    throw new Error('노트를 불러올 수 없습니다.')
  }
}

// 페이지네이션과 정렬을 포함한 노트 목록 조회
export async function getNotesPaginated({
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: {
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'updated_at' | 'title'
  sortOrder?: 'asc' | 'desc'
}) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    // 페이지네이션 계산
    const offset = (page - 1) * limit

    // 정렬 옵션 설정
    const orderByColumn = sortBy === 'title' ? notes.title : 
                         sortBy === 'updated_at' ? notes.updatedAt : 
                         notes.createdAt
    
    const orderBy = sortOrder === 'asc' ? orderByColumn : desc(orderByColumn)

    // 전체 노트 수 조회 (페이지네이션용)
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(eq(notes.userId, user.id))

    const totalCount = totalCountResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // 페이지네이션된 노트 조회
    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    return {
      notes: userNotes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  } catch (error) {
    console.error('노트 페이지네이션 조회 오류:', error)
    throw new Error('노트를 불러올 수 없습니다.')
  }
}

// 검색과 정렬을 포함한 노트 목록 조회 (새로운 통합 함수)
export async function getNotesWithSearchAndSort({
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'created_at',
  sortOrder = 'desc'
}: {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'created_at' | 'updated_at' | 'title'
  sortOrder?: 'asc' | 'desc'
}) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('인증 실패:', authError)
    throw new Error('인증이 필요합니다.')
  }

  console.log('노트 목록 조회 시작:', { page, limit, search, sortBy, sortOrder, userId: user.id })

  try {
    // 페이지네이션 계산
    const offset = (page - 1) * limit

    // 정렬 옵션 설정
    const orderByColumn = sortBy === 'title' ? notes.title : 
                         sortBy === 'updated_at' ? notes.updatedAt : 
                         notes.createdAt
    
    const orderBy = sortOrder === 'asc' ? orderByColumn : desc(orderByColumn)

    // 검색 조건 설정
    let whereCondition = eq(notes.userId, user.id)
    
    if (search.trim()) {
      const searchPattern = `%${search.trim()}%`
      whereCondition = and(
        eq(notes.userId, user.id),
        or(
          ilike(notes.title, searchPattern),
          ilike(notes.content, searchPattern)
        )
      )!
    }

    // 전체 노트 수 조회 (검색 조건 포함)
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(whereCondition)

    const totalCount = totalCountResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // 검색 및 정렬된 노트 조회
    const userNotes = await db
      .select()
      .from(notes)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    console.log('노트 목록 조회 완료:', {
      notesCount: userNotes.length,
      noteIds: userNotes.map(note => note.id),
      totalCount,
      totalPages
    })

    return {
      notes: userNotes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      searchQuery: search
    }
  } catch (error) {
    console.error('노트 검색 및 정렬 조회 오류:', error)
    throw new Error('노트를 불러올 수 없습니다.')
  }
}

// 단일 노트 조회 (상세 페이지용)
export async function getNoteById(noteId: string) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('인증 실패:', authError)
    throw new Error('인증이 필요합니다.')
  }

  console.log('노트 조회 시도:', { noteId, userId: user.id })

  try {
    // 먼저 해당 ID의 노트가 존재하는지 확인 (권한 무관)
    const [noteExists] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    console.log('노트 존재 여부 확인:', noteExists ? '존재함' : '존재하지 않음')
    
    if (noteExists) {
      console.log('노트 소유자:', noteExists.userId, '현재 사용자:', user.id)
    }

    // 사용자 소유의 노트만 조회 (한 번의 쿼리로 권한 검증 포함)
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
      .limit(1)

    console.log('노트 조회 결과:', note ? '찾음' : '없음')

    // 노트가 존재하지 않는 경우 (권한 없음 또는 노트 없음)
    if (!note) {
      if (noteExists && noteExists.userId !== user.id) {
        console.log('노트는 존재하지만 권한이 없음')
        throw new Error('FORBIDDEN')
      } else {
        console.log('노트를 찾을 수 없음 - 존재하지 않음')
        throw new Error('NOT_FOUND')
      }
    }

    return note
  } catch (error) {
    console.error('노트 조회 오류:', error)
    
    // NOT_FOUND, FORBIDDEN 에러는 그대로 전달
    if (error instanceof Error && (error.message === 'NOT_FOUND' || error.message === 'FORBIDDEN')) {
      throw error
    }
    
    // 기타 에러는 일반적인 메시지로 변환
    throw new Error('노트를 불러올 수 없습니다.')
  }
}

// 노트 수정 (자동 저장용)
export async function updateNote(noteId: string, data: { title: string; content: string }) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    // 기존 노트 조회 및 권한 검증
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (!existingNote) {
      throw new Error('NOT_FOUND')
    }

    if (existingNote.userId !== user.id) {
      throw new Error('FORBIDDEN')
    }

    // 데이터 검증
    const validatedData = insertNoteSchema.partial().parse({
      title: data.title || '제목 없음',
      content: data.content || '',
      updatedAt: new Date()
    })

    // 노트 업데이트
    const [updatedNote] = await db
      .update(notes)
      .set(validatedData)
      .where(eq(notes.id, noteId))
      .returning()

    // 노트 내용이 변경된 경우 기존 요약과 태그 삭제 (자동 재생성 유도)
    if (data.content !== existingNote.content) {
      await db
        .delete(summaries)
        .where(eq(summaries.noteId, noteId))
      
      await db
        .delete(noteTags)
        .where(eq(noteTags.noteId, noteId))
    }

    // 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)
    
    return updatedNote
  } catch (error) {
    console.error('노트 수정 오류:', error)
    
    // 특정 에러 타입에 따라 다른 에러 메시지 반환
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        throw new Error('NOT_FOUND')
      }
      if (error.message === 'FORBIDDEN') {
        throw new Error('FORBIDDEN')
      }
    }
    
    throw new Error('노트 저장에 실패했습니다.')
  }
}

// 디버깅용: 사용자의 모든 노트 조회
export async function debugGetUserNotes() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    const userNotes = await db
      .select({ id: notes.id, title: notes.title, userId: notes.userId })
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.createdAt))

    console.log('사용자 노트 목록:', userNotes)
    return userNotes
  } catch (error) {
    console.error('사용자 노트 조회 오류:', error)
    return []
  }
}

// 노트 삭제 (즉시 삭제)
export async function deleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다.')
    }

    // 기존 노트 조회 및 권한 검증
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1)

    if (!existingNote) {
      throw new Error('NOT_FOUND')
    }

    if (existingNote.userId !== user.id) {
      throw new Error('FORBIDDEN')
    }

    // 노트 삭제 (즉시 삭제)
    const [deletedNote] = await db
      .delete(notes)
      .where(eq(notes.id, noteId))
      .returning()

    // 캐시 무효화
    revalidatePath('/notes')
    revalidatePath(`/notes/${noteId}`)
    
    return deletedNote
  } catch (error) {
    console.error('노트 삭제 오류:', error)
    
    // 특정 에러 타입에 따라 다른 에러 메시지 반환
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        throw new Error('NOT_FOUND')
      }
      if (error.message === 'FORBIDDEN') {
        throw new Error('FORBIDDEN')
      }
    }
    
    throw new Error('노트 삭제에 실패했습니다.')
  }
}