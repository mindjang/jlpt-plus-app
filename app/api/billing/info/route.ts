import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { getBillingInfo } from '@/lib/firebase/firestore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const [user, authError] = await requireAuth(request)
    if (authError) return authError

    const customerId = user!.uid
    const billingInfo = await getBillingInfo(customerId)

    return NextResponse.json({ billingInfo })
  } catch (error: any) {
    console.error('[billing/info] error', {
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
