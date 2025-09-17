// components/ai/test-ai-form.tsx
// AI 테스트 폼 컴포넌트
// 사용자가 AI 텍스트 생성을 테스트할 수 있는 인터랙티브 폼
// 관련 파일: app/test-ai/page.tsx, lib/ai/actions.ts

'use client'

import { useState } from 'react'
import { generateText } from '@/lib/ai/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Send, RefreshCw } from 'lucide-react'

interface TestResult {
  success: boolean
  text?: string
  error?: string
  timestamp: Date
}

export function TestAIForm() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await generateText(prompt)
      
      setResult({
        success: response.success,
        text: response.text,
        error: response.error,
        timestamp: new Date()
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        timestamp: new Date()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setPrompt('')
    setResult(null)
  }

  const handleRetry = () => {
    if (prompt.trim()) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 텍스트 생성 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                프롬프트 입력
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI에게 질문하거나 요청할 내용을 입력하세요..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? '생성 중...' : '텍스트 생성'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClear}
                disabled={isLoading}
              >
                초기화
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                결과
                <span className={`px-2 py-1 rounded text-sm ${
                  result.success 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {result.success ? '성공' : '실패'}
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {result.timestamp.toLocaleString('ko-KR')}
            </p>
          </CardHeader>
          <CardContent>
            {result.success && result.text ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">생성된 텍스트:</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm">
                      {result.text}
                    </pre>
                  </div>
                </div>
              </div>
            ) : result.error ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">오류:</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {result.error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* 사용 예시 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 예시</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              다음 예시들을 클릭하여 테스트해보세요:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '안녕하세요! 간단한 인사말을 해주세요.',
                'JavaScript의 장점 3가지를 설명해주세요.',
                '오늘 날씨가 좋네요. 이에 대한 짧은 시를 써주세요.',
                '프로그래밍을 배우는 방법을 조언해주세요.'
              ].map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(example)}
                  disabled={isLoading}
                  className="text-left justify-start h-auto p-3"
                >
                  <span className="text-xs">{example}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
