import type { User } from 'firebase/auth'
import type { JlptLevel } from '@/lib/types/content'

export type ReportContentType = 'word' | 'kanji'

export interface SubmitReportInput {
  contentType: ReportContentType
  contentText: string
  level: JlptLevel
  reason: string
}

/**
 * 신고 제출 (클라이언트)
 * - Firebase ID 토큰을 Authorization 헤더로 전달
 * - API 에러 응답 포맷을 일관되게 파싱
 */
export async function submitReport(user: User, input: SubmitReportInput): Promise<string> {
  const token = await user.getIdToken()

  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType: input.contentType,
      contentText: input.contentText,
      level: input.level,
      reason: input.reason,
    }),
  })

  const data = await response.json().catch(() => ({} as any))

  if (!response.ok) {
    throw new Error(data?.error || '신고 제출에 실패했습니다.')
  }

  return data.reportId as string
}

