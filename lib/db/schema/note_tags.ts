// lib/db/schema/note_tags.ts
// 태그 데이터 모델 스키마 정의
// Drizzle ORM을 사용하여 PostgreSQL note_tags 테이블 구조를 정의하고 TypeScript 타입을 자동 생성
// 관련 파일: drizzle.config.ts, lib/db/connection.ts, lib/ai/tag-actions.ts

import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { notes } from './notes'

export const noteTags = pgTable('note_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  noteIdIdx: index('idx_note_tags_note_id').on(table.noteId),
  tagIdx: index('idx_note_tags_tag').on(table.tag),
  noteTagUniqueIdx: uniqueIndex('idx_note_tags_note_tag').on(table.noteId, table.tag)
}))

// Zod 스키마 자동 생성
export const insertNoteTagSchema = createInsertSchema(noteTags)
export const selectNoteTagSchema = createSelectSchema(noteTags)

export type NoteTag = typeof noteTags.$inferSelect
export type NewNoteTag = typeof noteTags.$inferInsert
