// lib/db/schema/error_logs.ts
// AI 처리 에러 로그 테이블 스키마
// 에러 발생 시 디버깅과 모니터링을 위한 로그 저장
// 관련 파일: lib/db/schema/index.ts, lib/ai/error-handler.ts

import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  errorType: text('error_type').notNull(), // 'API_ERROR', 'NETWORK_ERROR', 'QUOTA_EXCEEDED', etc.
  errorMessage: text('error_message').notNull(),
  errorDetails: jsonb('error_details'), // 원본 에러 객체 (민감한 정보 제외)
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  context: jsonb('context'), // 요청 컨텍스트 정보 (노트 ID, 사용자 액션 등)
  resolved: boolean('resolved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})
