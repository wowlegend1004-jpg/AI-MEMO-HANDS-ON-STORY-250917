// app/test-ai/page.tsx
// AI 서비스 테스트 페이지
// Gemini API 연동 상태를 확인하고 기본 기능을 테스트하는 페이지
// 관련 파일: lib/ai/actions.ts, lib/ai/gemini-client.ts

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkAIHealth, generateText, getAIUsageStats } from '@/lib/ai/actions'
import { TestAIForm } from '@/components/ai/test-ai-form'

export default async function TestAIPage() {
  // 로그인 확인
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/signin')
  }

  // AI 헬스체크
  const healthResult = await checkAIHealth()
  const usageStats = await getAIUsageStats()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">AI 서비스 테스트</h1>
      
      {/* AI 상태 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">AI 서비스 상태</h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>연결 상태:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                healthResult.isHealthy 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {healthResult.isHealthy ? '정상' : '오류'}
              </span>
            </div>
            <div>
              <strong>에러 메시지:</strong>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {healthResult.error || '없음'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 사용량 통계 */}
      {usageStats.success && usageStats.stats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">사용량 통계</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong>총 요청 수:</strong>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {usageStats.stats.totalRequests}
                </div>
              </div>
              <div>
                <strong>성공률:</strong>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {usageStats.stats.successRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <strong>평균 응답시간:</strong>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {usageStats.stats.averageLatency.toFixed(0)}ms
                </div>
              </div>
              <div>
                <strong>총 토큰 수:</strong>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {usageStats.stats.totalTokens}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 테스트 폼 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">AI 텍스트 생성 테스트</h2>
        <TestAIForm />
      </div>

      {/* 환경변수 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">환경 설정</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div>
                <strong>GEMINI_API_KEY:</strong> 
                <span className="ml-2">
                  {process.env.GEMINI_API_KEY ? '설정됨' : '설정되지 않음'}
                </span>
              </div>
              <div>
                <strong>GEMINI_MODEL:</strong> 
                <span className="ml-2">{process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'}</span>
              </div>
              <div>
                <strong>GEMINI_MAX_TOKENS:</strong> 
                <span className="ml-2">{process.env.GEMINI_MAX_TOKENS || '8192'}</span>
              </div>
              <div>
                <strong>GEMINI_TIMEOUT_MS:</strong> 
                <span className="ml-2">{process.env.GEMINI_TIMEOUT_MS || '10000'}</span>
              </div>
              <div>
                <strong>NODE_ENV:</strong> 
                <span className="ml-2">{process.env.NODE_ENV}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
