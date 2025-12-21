'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { saveMembership, saveBillingInfo, getMembership } from '@/lib/firebase/firestore'
import type { Membership } from '@/lib/types/membership'

type Plan = 'monthly' | 'quarterly' // 정기구독: 1개월, 3개월

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 4900),
  quarterly: Number(process.env.PORTONE_QUARTERLY_AMOUNT || 13900), // 3개월 (약 10% 할인)
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
    const { billingKey, plan, paymentMethod } = body as {
      billingKey?: string
      plan?: Plan
      paymentMethod?: 'CARD' | 'EASY_PAY'
    }

    // customerId는 인증된 사용자의 uid를 사용
    const customerId = user!.uid

    // 디버깅을 위한 로깅
    console.log('[pay/subscribe] Request received', {
      hasBillingKey: !!billingKey,
      billingKeyLength: billingKey?.length,
      plan,
      customerId,
    })

    if (!billingKey || !plan) {
      console.error('[pay/subscribe] Missing required fields', {
        hasBillingKey: !!billingKey,
        hasPlan: !!plan,
        billingKey,
        plan,
      })
      return NextResponse.json(
        { 
          error: 'billingKey, plan are required',
          received: { hasBillingKey: !!billingKey, hasPlan: !!plan }
        },
        { status: 400 }
      )
    }

    if (!['monthly', 'quarterly'].includes(plan)) {
      console.error('[pay/subscribe] Invalid plan', { plan })
      return NextResponse.json(
        { error: 'invalid plan. only monthly or quarterly subscription is allowed', received: plan },
        { status: 400 }
      )
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
          currency: 'KRW',
        }),
      }
    )

    const paymentJson = await paymentResponse.json().catch(() => ({}))
    if (!paymentResponse.ok) {
      console.error('[pay/subscribe] PortOne API failed', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        response: paymentJson,
        request: {
          paymentId,
          billingKey: billingKey?.substring(0, 20) + '...',
          plan,
          amount,
        },
      })
      return NextResponse.json(
        { 
          error: paymentJson?.message || 'payment failed',
          detail: paymentJson,
          portoneStatus: paymentResponse.status,
        },
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
      paymentMethod: paymentMethod || 'CARD', // 결제 수단 저장
    })

    console.log('[pay/subscribe] Success', {
      paymentId,
      plan,
      customerId,
      newExpiry: new Date(newExpiry).toISOString(),
    })

    return NextResponse.json({ ok: true, paymentId, membership })
  } catch (error: any) {
    console.error('[pay/subscribe] error', {
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
