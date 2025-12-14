import { NextRequest, NextResponse } from 'next/server'
import { submitReport } from '@/lib/firebase/firestore/reports'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { getCurrentUser } from '@/lib/firebase/auth'

/**
 * POST /api/reports - 신고 제출
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentType, contentText, level, reason } = body

    // 유효성 검사
    if (!contentType || !['word', 'kanji'].includes(contentType)) {
      return NextResponse.json(
        { error: '올바른 콘텐츠 타입을 지정해주세요.' },
        { status: 400 }
      )
    }

    if (!contentText || !contentText.trim()) {
      return NextResponse.json(
        { error: '콘텐츠 텍스트를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!level || !['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
      return NextResponse.json(
        { error: '올바른 레벨을 지정해주세요.' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: '신고 사유를 10자 이상 입력해주세요.' },
        { status: 400 }
      )
    }

    // 신고 제출
    const reportId = await submitReport(user.uid, {
      contentType,
      contentText: contentText.trim(),
      level,
      reason: reason.trim(),
    })

    return NextResponse.json({
      success: true,
      reportId,
    })
  } catch (error) {
    console.error('[API] Error submitting report:', error)
    return NextResponse.json(
      { error: '신고 제출에 실패했습니다.' },
      { status: 500 }
    )
  }
}
