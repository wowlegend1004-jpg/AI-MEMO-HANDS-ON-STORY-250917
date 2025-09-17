// lib/ai/summary-utils.ts
// 요약 관련 유틸리티 함수들
// 요약 생성에 필요한 검증 및 헬퍼 함수들을 제공
// 관련 파일: lib/ai/summary-actions.ts, lib/ai/types.ts

import { SummaryValidationResult } from './types'

// 노트 내용 길이 검증 함수
export function validateNoteContent(content: string): SummaryValidationResult {
  const minLength = 100
  const currentLength = content.trim().length
  
  if (currentLength < minLength) {
    return {
      isValid: false,
      minLength,
      currentLength,
      reason: `노트 내용이 너무 짧습니다. 최소 ${minLength}자 이상이 필요합니다.`
    }
  }
  
  return {
    isValid: true,
    minLength,
    currentLength
  }
}

// 요약 텍스트를 불릿 포인트 배열로 파싱
export function parseSummaryBulletPoints(summaryText: string): string[] {
  return summaryText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // 불릿 포인트 기호 제거
      return line.replace(/^[-•*]\s*/, '').trim()
    })
}

// 요약 텍스트 정리 (불필요한 공백 제거)
export function cleanSummaryText(summaryText: string): string {
  return summaryText
    .replace(/\n\s*\n/g, '\n') // 연속된 빈 줄 제거
    .replace(/^\s+|\s+$/g, '') // 앞뒤 공백 제거
    .trim()
}
