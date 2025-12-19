'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { saveMembership, saveBillingInfo, getMembership } from '@/lib/firebase/firestore'
import type { Membership } from '@/lib/types/membership'

type Plan = 'monthly' | 'quarterly' // 정기구독: 1개월, 3개월

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 4900),
  quarterly: Number(process.env.PORTONE_QUARTERLY_AMOUNT || 13000), // 3개월 (약 10% 할인)
}

function getDurationMs(plan: Plan) {
  return plan === 'monthly'
    ? 30 * 24 * 60 * 60 * 1000 // 1개월
    : 90 * 24 * 60 * 60 * 1000 // 3개월
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { billingKey, plan } = body as {
      billingKey?: string
      plan?: Plan
    }

    // customerId는 인증된 사용자의 uid를 사용
    const customerId = user!.uid

    if (!billingKey || !plan) {
      return NextResponse.json({ error: 'billingKey, plan are required' }, { status: 400 })
    }

    if (!['monthly', 'quarterly'].includes(plan)) {
      return NextResponse.json({ error: 'invalid plan. only monthly or quarterly subscription is allowed' }, { status: 400 })
    }

    const apiSecret = process.env.PORTONE_API_SECRET
    if (!apiSecret) {
      return NextResponse.json({ error: 'PORTONE_API_SECRET is not configured' }, { status: 500 })
    }

    const paymentId = `sub-${plan}-${customerId}-${Date.now()}`
    const amount = PLAN_AMOUNTS[plan]
    const orderName = plan === 'monthly' 
      ? '일본어학습 구독권 (1개월 정기결제)'
      : '일본어학습 구독권 (3개월 정기결제)'

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/billing-key`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingKey,
          orderName,
          customer: {
            id: customerId,
          },
          amount: {
            total: amount,
          },
          currency: 'CURRENCY_KRW',
        }),
      }
    )

    const paymentJson = await paymentResponse.json().catch(() => ({}))
    if (!paymentResponse.ok) {
      return NextResponse.json(
        { error: paymentJson?.message || 'payment failed', detail: paymentJson },
        { status: 400 }
      )
    }

    // 구독 만료일 계산 (기존 만료일 이후로 연장)
    const now = Date.now()
    const current = await getMembership(customerId)
    const baseTime = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now
    const newExpiry = baseTime + getDurationMs(plan)

    const membership: Membership = {
      type: plan === 'quarterly' ? 'monthly' : plan, // quarterly는 내부적으로 monthly로 저장 (3개월 기간만 다름)
      source: 'subscription',
      expiresAt: newExpiry,
      createdAt: current?.createdAt || now,
      updatedAt: now,
      lastRedeemedCode: current?.lastRedeemedCode,
    }

    await saveMembership(customerId, membership)
    await saveBillingInfo(customerId, {
      billingKey,
      plan: plan === 'quarterly' ? 'quarterly' : plan,
      lastPaymentId: paymentId,
      lastPaidAt: now,
      amount,
      provider: 'portone',
      isRecurring: true,
    })

    return NextResponse.json({ ok: true, paymentId, membership })
  } catch (error: any) {
    console.error('[pay/subscribe] error', error)
    return NextResponse.json({ error: error?.message || 'unknown error' }, { status: 500 })
  }
}
