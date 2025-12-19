'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'

type Plan = 'monthly' // 정기구독은 월간만 가능 (최대 3개월)

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 9900),
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { billingKey, plan, timeToPay } = body as {
      billingKey?: string
      plan?: Plan
      timeToPay?: string
    }

    // customerId는 인증된 사용자의 uid를 사용
    const customerId = user!.uid

    if (!billingKey || !plan) {
      return NextResponse.json({ error: 'billingKey, plan are required' }, { status: 400 })
    }

    if (plan !== 'monthly') {
      return NextResponse.json({ error: 'only monthly subscription is allowed' }, { status: 400 })
    }

    const apiSecret = process.env.PORTONE_API_SECRET
    if (!apiSecret) {
      return NextResponse.json({ error: 'PORTONE_API_SECRET is not configured' }, { status: 500 })
    }

    const paymentId = `pay-${plan}-${customerId}-${Date.now()}`
    const orderName = '일본어학습 구독권 (월간 정기결제)'
    const amount = PLAN_AMOUNTS[plan]

    const scheduleRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/schedule`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: {
            billingKey,
            orderName,
            customer: {
              id: customerId,
            },
            amount: {
              total: amount,
            },
            currency: 'KRW',
          },
          timeToPay: timeToPay || new Date().toISOString(),
        }),
      }
    )

    const scheduleJson = await scheduleRes.json().catch(() => ({}))
    if (!scheduleRes.ok) {
      return NextResponse.json(
        { error: scheduleJson?.message || '예약 결제 실패', detail: scheduleJson },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, paymentId, result: scheduleJson })
  } catch (error: any) {
    console.error('[pay/schedule] error', error)
    return NextResponse.json({ error: error?.message || 'unknown error' }, { status: 500 })
  }
}
