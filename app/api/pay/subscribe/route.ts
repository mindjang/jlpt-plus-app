'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { saveMembership, saveBillingInfo, getMembership } from '@/lib/firebase/firestore'
import type { Membership } from '@/lib/types/membership'

type Plan = 'monthly' | 'quarterly' // 정기구독: 1개월, 3개월

const PLAN_AMOUNTS: Record<Plan, number> = {
  monthly: Number(process.env.PORTONE_MONTHLY_AMOUNT || 5900),
  quarterly: Number(process.env.PORTONE_QUARTERLY_AMOUNT || 14900),
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
    const { billingKey, plan, paymentMethod, easyPayProvider, customer } = body as {
      billingKey?: string
      plan?: Plan
      paymentMethod?: 'CARD' | 'EASY_PAY'
      easyPayProvider?: string
      customer?: {
        fullName?: string
        email?: string
        phoneNumber?: string
      }
    }

    // customerId는 인증된 사용자의 uid를 사용
    const customerId = user!.uid

    // 디버깅을 위한 로깅
    console.log('[pay/subscribe] Request received', {
      hasBillingKey: !!billingKey,
      billingKeyLength: billingKey?.length,
      plan,
      customerId,
      hasCustomerInfo: !!customer
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

    // paymentId 생성 (특수문자 제외)
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 8)
    const paymentId = `sub-${plan}-${timestamp}-${randomPart}`

    const amount = PLAN_AMOUNTS[plan]
    const orderName = plan === 'monthly'
      ? '일본어학습 구독권 (1개월 정기결제)'
      : '일본어학습 구독권 (3개월 정기결제)'

    // KG이니시스 필수 파라미터 구성
    const apiBody: any = {
      billingKey,
      orderName,
      customer: {
        id: customerId,
        // KG이니시스는 이름/이메일/전화번호가 필수일 수 있음 (문서 기준)
        name: {
          full: customer?.fullName || (user as any).name || (user as any).displayName || '사용자',
        },
        email: customer?.email || user!.email || 'no-email@example.com',
        phoneNumber: customer?.phoneNumber || '010-0000-0000',
      },
      amount: {
        total: amount,
      },
      currency: 'KRW',
    };

    console.log('[pay/subscribe] Calling PortOne API', {
      url: `https://api.portone.io/payments/${paymentId}/billing-key`,
      paymentId,
      customer: apiBody.customer
    });

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${paymentId}/billing-key`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBody),
      }
    )

    const paymentJson = await paymentResponse.json().catch(() => ({}))

    if (!paymentResponse.ok) {
      console.error('[pay/subscribe] PortOne API failed', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        error: paymentJson,
        requestBody: {
          ...apiBody,
          billingKey: 'HIDDEN'
        }
      })

      // 구체적인 에러 메시지 반환
      return NextResponse.json(
        {
          error: paymentJson?.message || '결제 요청이 실패했습니다.',
          detail: paymentJson,
          portoneStatus: paymentResponse.status,
        },
        { status: paymentResponse.status >= 500 ? 502 : 400 }
      )
    }

    // PortOne 응답에서 간편결제 제공사 정보 추출
    let extractedEasyPayProvider: string | undefined = easyPayProvider
    if (paymentMethod === 'EASY_PAY' && !extractedEasyPayProvider) {
      // PortOne 응답에서 간편결제 제공사 정보 확인
      const responseProvider = (paymentJson as any)?.easyPay?.provider ||
        (paymentJson as any)?.provider ||
        (paymentJson as any)?.method?.provider

      if (responseProvider) {
        // PortOne에서 반환하는 제공사 코드를 우리 타입에 맞게 변환
        const providerMap: Record<string, string> = {
          'KAKAOPAY': 'KAKAOPAY',
          'NAVERPAY': 'NAVERPAY',
          'TOSS': 'TOSS',
          'PAYCO': 'PAYCO',
          'SSG': 'SSG',
          'LPAY': 'LPAY',
          'KPAY': 'KPAY',
          'INIPAY': 'INIPAY',
          'PAYPAL': 'PAYPAL',
          'APPLEPAY': 'APPLEPAY',
          'SAMSUNGPAY': 'SAMSUNGPAY',
          'LPOINT': 'LPOINT',
          'SKPAY': 'SKPAY',
        }
        extractedEasyPayProvider = providerMap[responseProvider.toUpperCase()] || 'OTHER'
      }
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
      easyPayProvider: extractedEasyPayProvider as any, // 간편결제 제공사 저장
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
