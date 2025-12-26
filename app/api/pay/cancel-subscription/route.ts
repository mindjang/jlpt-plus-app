import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { getMembership, saveMembership, getBillingInfo, saveBillingInfo } from '@/lib/firebase/firestore/membership'
import type { Membership, BillingInfo } from '@/lib/types/membership'

export const dynamic = 'force-dynamic'

/**
 * 구독 취소 API
 * 정기구독을 취소하고 현재 만료일까지만 사용 가능하도록 설정
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const customerId = user!.uid

    // 현재 멤버십 정보 확인
    const membership = await getMembership(customerId)
    if (!membership || membership.source !== 'subscription') {
      return NextResponse.json(
        { error: '정기구독 중인 멤버십이 없습니다.' },
        { status: 400 }
      )
    }

    // 현재 만료일 확인
    const now = Date.now()
    if (membership.expiresAt <= now) {
      return NextResponse.json(
        { error: '이미 만료된 구독입니다.' },
        { status: 400 }
      )
    }

    // BillingInfo에서 isRecurring을 false로 변경하여 자동 갱신 중지
    const billingInfo = await getBillingInfo(customerId)
    if (billingInfo) {
      const updatedBillingInfo: BillingInfo = {
        ...billingInfo,
        isRecurring: false, // 자동 갱신 중지
      }
      await saveBillingInfo(customerId, updatedBillingInfo)
    }

    // 멤버십 정보는 그대로 유지 (만료일까지만 사용 가능)
    // source는 'subscription'으로 유지하여 구독 취소 상태임을 표시

    console.info('[pay/cancel-subscription] Subscription cancelled', {
      customerId,
      expiresAt: new Date(membership.expiresAt).toISOString(),
      timestamp: Date.now(),
    })

    // 서버 사이드에서 안전하게 날짜 포맷팅
    let expiresAtFormatted: string
    try {
      expiresAtFormatted = new Date(membership.expiresAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Seoul',
      })
    } catch (dateError) {
      // 날짜 포맷팅 실패 시 ISO 문자열 사용
      expiresAtFormatted = new Date(membership.expiresAt).toISOString()
    }

    return NextResponse.json({
      ok: true,
      message: '구독이 취소되었습니다.',
      expiresAt: membership.expiresAt,
      expiresAtFormatted,
    })
  } catch (error: any) {
    console.error('[pay/cancel-subscription] error', {
      error: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      {
        error: error?.message || '구독 취소에 실패했습니다.',
        type: error?.name || 'UnknownError',
      },
      { status: 500 }
    )
  }
}
