// components/ai/ai-text-generator.tsx
// AI 텍스트 생성 컴포넌트
// 노트 편집 중에 AI를 활용한 텍스트 생성 기능을 제공
// 관련 파일: lib/ai/actions.ts, components/notes/markdown-editor.tsx

'use client'

import { useState } from 'react'
import { generateText } from '@/lib/ai/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'

interface AITextGeneratorProps {
  onTextGenerated: (text: string) => void
  className?: string
}

export function AITextGenerator({ onTextGenerated, className }: AITextGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setGeneratedText('')

    try {
      const result = await generateText(prompt)
      
      if (result.success && result.text) {
        setGeneratedText(result.text)
      } else {
        console.error('AI 텍스트 생성 실패:', result.error)
      }
    } catch (error) {
      console.error('AI 텍스트 생성 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseText = () => {
    if (generatedText) {
      onTextGenerated(generatedText)
      setGeneratedText('')
      setPrompt('')
    }
  }

  const handleCopy = async () => {
    if (generatedText) {
      try {
        await navigator.clipboard.writeText(generatedText)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (error) {
        console.error('복사 실패:', error)
      }
    }
  }

  const examplePrompts = [
    '이 주제에 대한 개요를 작성해주세요',
    '핵심 포인트 3가지를 정리해주세요',
    '이 내용을 요약해주세요',
    '관련 질문 5개를 만들어주세요',
    '이 주제에 대한 결론을 작성해주세요'
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI 텍스트 생성
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 프롬프트 입력 */}
        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium mb-2">
            AI에게 요청할 내용
          </label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="AI에게 어떤 텍스트를 생성해달라고 요청하시겠습니까?"
            className="min-h-[80px]"
            disabled={isLoading}
          />
        </div>

        {/* 예시 프롬프트 */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">예시 프롬프트:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrompt(example)}
                disabled={isLoading}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        <Button 
          type="button"
          onClick={handleGenerate} 
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              텍스트 생성
            </>
          )}
        </Button>

        {/* 생성된 텍스트 */}
        {generatedText && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">생성된 텍스트:</h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      복사
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleUseText}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  사용하기
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">
                {generatedText}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
