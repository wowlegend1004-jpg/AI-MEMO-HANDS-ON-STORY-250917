// Drizzle ORM 설정 파일
// 데이터베이스 마이그레이션 및 스키마 관리를 위한 설정
// drizzle-kit이 스키마 파일과 마이그레이션을 관리하는데 사용됨
// 관련 파일: lib/db/schema/*.ts, drizzle/*.sql

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// .env.local 파일 로드
config({ path: '.env.local' })

export default defineConfig({
    out: './drizzle',
    schema: './lib/db/schema/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})
