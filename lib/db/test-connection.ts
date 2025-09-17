// lib/db/test-connection.ts
// 데이터베이스 연결 테스트용 임시 파일
// 연결 문제를 진단하기 위해 사용

import { db } from './connection'

export async function testConnection() {
  try {
    console.log('데이터베이스 연결 테스트 시작...')
    
    // 간단한 쿼리로 연결 테스트
    const result = await db.execute('SELECT 1 as test')
    console.log('데이터베이스 연결 성공:', result)
    
    return { success: true, result }
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error)
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' }
  }
}
