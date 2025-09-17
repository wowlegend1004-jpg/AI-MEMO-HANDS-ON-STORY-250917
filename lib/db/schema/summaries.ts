// lib/db/schema/summaries.ts
// 요약 데이터 모델 스키마 정의
// Drizzle ORM을 사용하여 PostgreSQL summaries 테이블 구조를 정의하고 TypeScript 타입을 자동 생성
// 관련 파일: drizzle.config.ts, lib/db/connection.ts, lib/ai/summary-actions.ts

import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { notes } from './notes'

export const summaries = pgTable('summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  model: varchar('model', { length: 50 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

// Zod 스키마 자동 생성
export const insertSummarySchema = createInsertSchema(summaries)
export const selectSummarySchema = createSelectSchema(summaries)

export type Summary = typeof summaries.$inferSelect
export type NewSummary = typeof summaries.$inferInsert
