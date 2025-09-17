// app/api/ai-chat/route.ts
// AI 대화 API 엔드포인트
// 사용자의 메시지를 받아서 AI가 응답하는 기능
// 관련 파일: lib/ai/gemini-client.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiClient } from '@/lib/ai/gemini-client'

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: '메시지와 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // AI 응답 생성
    const systemPrompt = `당신은 도움이 되는 AI 어시스턴트입니다. 
사용자와 자연스럽고 친근하게 대화하며, 질문에 대해 정확하고 유용한 답변을 제공해주세요.
한국어로 응답하며, 필요에 따라 이모지를 사용하여 친근함을 표현해주세요.
답변은 간결하면서도 충분한 정보를 포함하도록 해주세요.`

    const chatPrompt = `${systemPrompt}

사용자 메시지: ${message}

위 사용자 메시지에 대해 도움이 되는 답변을 해주세요.`

    const geminiClient = new GeminiClient()
    const aiResponse = await geminiClient.generateText(chatPrompt)

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI 대화 오류:', error)
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
