// lib/db/schema/notes.ts
// 노트 데이터 모델 스키마 정의
// Drizzle ORM을 사용하여 PostgreSQL 테이블 구조를 정의하고 TypeScript 타입을 자동 생성
// 관련 파일: drizzle.config.ts, lib/db/connection.ts, lib/notes/actions.ts

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull().default('제목 없음'),
    content: text('content'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// Zod 스키마 자동 생성
export const insertNoteSchema = createInsertSchema(notes)
export const selectNoteSchema = createSelectSchema(notes)

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
