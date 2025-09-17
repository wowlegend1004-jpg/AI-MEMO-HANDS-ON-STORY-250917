// app/test-db/page.tsx
// 데이터베이스 연결 테스트 페이지
// 임시로 연결 문제를 진단하기 위해 사용

import { testConnection } from '@/lib/db/test-connection'
import { debugGetUserNotes } from '@/lib/notes/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestDbPage() {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  const connectionResult = await testConnection()
  const userNotes = await debugGetUserNotes()
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">데이터베이스 연결 테스트</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">연결 상태</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(connectionResult, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">사용자 노트 목록</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(userNotes, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">사용자 정보</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
