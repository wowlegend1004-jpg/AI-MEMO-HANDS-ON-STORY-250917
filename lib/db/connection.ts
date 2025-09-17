// lib/db/connection.ts
// Drizzle ORM 데이터베이스 연결 설정
// Supabase PostgreSQL 데이터베이스에 직접 연결하여 Drizzle ORM 사용
// 관련 파일: lib/db/schema/notes.ts, .env.local, drizzle.config.ts

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/notes'

const connectionString = process.env.DATABASE_URL!

// PostgreSQL 연결 생성
const client = postgres(connectionString)

// Drizzle 인스턴스 생성
export const db = drizzle(client, { schema })
