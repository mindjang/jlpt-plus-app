'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { saveMembership, getMembership } from '@/lib/firebase/firestore'
import type { Membership } from '@/lib/types/membership'

type OneTimePlan = 'monthly' | 'yearly' // 단건결제: 1개월, 1년

const PLAN_AMOUNTS: Record<OneTimePlan, number> = {
  monthly: Number(process.env.PORTONE_ONETIME_MONTHLY_AMOUNT || 6900),
  yearly: Number(process.env.PORTONE_ONETIME_YEARLY_AMOUNT || 69000),
}

function getDurationMs(plan: OneTimePlan) {
  return plan === 'monthly'
    ? 30 * 24 * 60 * 60 * 1000 // 1개월
    : 365 * 24 * 60 * 60 * 1000 // 1년
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { paymentId, plan } = body as {
      paymentId?: string
      plan?: OneTimePlan
    }

    const customerId = user!.uid

    if (!paymentId || !plan) {
      return NextResponse.json({ error: 'paymentId, plan are required' }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'invalid plan' }, { status: 400 })
    }

    // 구독 만료일 계산 (기존 만료일 이후로 연장)
    const now = Date.now()
    const current = await getMembership(customerId)
    const baseTime = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now
    const newExpiry = baseTime + getDurationMs(plan)

    const membership: Membership = {
      type: plan, // monthly 또는 yearly
      source: 'one-time', // 단건결제
      expiresAt: newExpiry,
      createdAt: current?.createdAt || now,
      updatedAt: now,
      lastRedeemedCode: current?.lastRedeemedCode,
    }

    await saveMembership(customerId, membership)
    
    // 단건결제는 billingKey 저장하지 않음 (정기결제가 아니므로)

    return NextResponse.json({ ok: true, paymentId, membership })
  } catch (error: any) {
    console.error('[pay/one-time] error', error)
    return NextResponse.json({ error: error?.message || 'unknown error' }, { status: 500 })
  }
}
