'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { saveMembership, getMembership } from '@/lib/firebase/firestore'
import type { Membership } from '@/lib/types/membership'

type Plan = 'monthly' | 'quarterly'

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 4900),
  quarterly: Number(process.env.PORTONE_QUARTERLY_AMOUNT || 13900),
}

function getDurationMs(plan: Plan) {
  return plan === 'monthly'
    ? 30 * 24 * 60 * 60 * 1000 // 1개월
    : 90 * 24 * 60 * 60 * 1000 // 3개월
}

/**
 * Google Play Billing 구매 토큰 검증 및 구독 활성화
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { purchaseToken, productId, orderId, plan } = body as {
      purchaseToken?: string
      productId?: string
      orderId?: string
      plan?: Plan
    }

    const customerId = user!.uid

    if (!purchaseToken || !productId || !plan) {
      return NextResponse.json(
        { error: 'purchaseToken, productId, and plan are required' },
        { status: 400 }
      )
    }

    if (!['monthly', 'quarterly'].includes(plan)) {
      return NextResponse.json(
        { error: 'invalid plan. only monthly or quarterly subscription is allowed' },
        { status: 400 }
      )
    }

    // Google Play Billing API를 사용하여 구매 검증
    // 실제 프로덕션에서는 Google Play Developer API를 사용하여 검증해야 함
    // 여기서는 클라이언트에서 받은 토큰을 신뢰하고 처리
    // TODO: Google Play Developer API를 통한 서버 사이드 검증 구현

    // 구독 만료일 계산
    const now = Date.now()
    const current = await getMembership(customerId)
    const baseTime = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now
    const newExpiry = baseTime + getDurationMs(plan)

    const membership: Membership = {
      type: plan === 'quarterly' ? 'monthly' : plan,
      source: 'google_play',
      expiresAt: newExpiry,
      createdAt: current?.createdAt || now,
      updatedAt: now,
      lastRedeemedCode: current?.lastRedeemedCode,
    }

    await saveMembership(customerId, membership)

    // Google Play 구매 정보 저장 (필요한 경우)
    // await saveBillingInfo(customerId, {
    //   purchaseToken,
    //   productId,
    //   plan,
    //   provider: 'google_play',
    //   isRecurring: true,
    // })

    console.log('[pay/google-play] Success', {
      purchaseToken: purchaseToken.substring(0, 20) + '...',
      productId,
      orderId,
      plan,
      customerId,
      newExpiry: new Date(newExpiry).toISOString(),
    })

    return NextResponse.json({ ok: true, purchaseToken, membership })
  } catch (error: any) {
    console.error('[pay/google-play] error', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: error?.message || 'unknown error',
        type: error?.name || 'UnknownError',
      },
      { status: 500 }
    )
  }
}

