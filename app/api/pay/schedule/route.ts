'use server'

import { NextResponse } from 'next/server'

type Plan = 'monthly' | 'yearly'

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 9900),
  yearly: Number(process.env.PORTONE_YEARLY_AMOUNT || 99000),
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { billingKey, plan, customerId, timeToPay } = body as {
      billingKey?: string
      plan?: Plan
      customerId?: string
      timeToPay?: string
    }

    if (!billingKey || !plan || !customerId) {
      return NextResponse.json({ error: 'billingKey, plan, customerId are required' }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'invalid plan' }, { status: 400 })
    }

    const apiSecret = process.env.PORTONE_API_SECRET
    if (!apiSecret) {
      return NextResponse.json({ error: 'PORTONE_API_SECRET is not configured' }, { status: 500 })
    }

    const paymentId = `pay-${plan}-${customerId}-${Date.now()}`
    const orderName = plan === 'monthly' ? '월간 이용권 정기결제' : '연간 이용권 정기결제'
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
