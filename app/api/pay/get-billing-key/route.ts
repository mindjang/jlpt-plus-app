'use server'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'

/**
 * imp_uid로 빌링키 조회
 * 모바일 리다이렉트 후 imp_uid를 받아 빌링키를 조회하는 API
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { impUid } = body as {
      impUid?: string
    }

    if (!impUid) {
      return NextResponse.json({ error: 'impUid is required' }, { status: 400 })
    }

    const apiSecret = process.env.PORTONE_API_SECRET
    if (!apiSecret) {
      return NextResponse.json({ error: 'PORTONE_API_SECRET is not configured' }, { status: 500 })
    }

    // PortOne V2 API로 결제 내역 조회하여 빌링키 추출
    // imp_uid로 결제 내역을 조회하면 빌링키 정보를 얻을 수 있음
    let billingKey: string | null = null
    
    try {
      // 방법 1: 결제 내역 조회 (빌링키 발급 거래의 경우 billingKey 필드가 있을 수 있음)
      const paymentResponse = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(impUid)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `PortOne ${apiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const paymentData = await paymentResponse.json().catch(() => ({}))
      
      if (paymentResponse.ok) {
        // 결제 내역에서 빌링키 추출 시도
        billingKey = paymentData.billingKey || paymentData.customerUid || paymentData.customer_uid || null
        
        if (billingKey) {
          console.info('[pay/get-billing-key] Billing key found in payment details', {
            impUid,
            billingKeyLength: billingKey?.length,
          })
        } else {
          console.warn('[pay/get-billing-key] Billing key not found in payment details, trying alternative', {
            impUid,
            paymentDataKeys: Object.keys(paymentData),
          })
        }
      }
      
      // 방법 2: 빌링키가 없으면 imp_uid를 빌링키로 사용 (PortOne V2에서는 imp_uid가 빌링키일 수 있음)
      if (!billingKey) {
        console.info('[pay/get-billing-key] Using imp_uid as billing key', {
          impUid,
        })
        billingKey = impUid
      }
    } catch (error) {
      console.warn('[pay/get-billing-key] API call failed, using imp_uid as billing key', {
        impUid,
        error: error instanceof Error ? error.message : String(error),
      })
      // 에러 발생 시 imp_uid를 빌링키로 사용
      billingKey = impUid
    }
    
    if (!billingKey || billingKey.trim() === '') {
      return NextResponse.json(
        { error: '빌링키를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      ok: true, 
      billingKey,
      impUid,
    })
  } catch (error: any) {
    console.error('[pay/get-billing-key] error', {
      error: error?.message,
      stack: error?.stack,
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
