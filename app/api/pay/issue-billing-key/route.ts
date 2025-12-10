'use server'

import { NextResponse } from 'next/server'

type IssueBody = {
  customerId: string
  fullName: string
  phoneNumber: string
  email: string
  cardNumber: string
  expiryYear: string // YY
  expiryMonth: string // MM
  birthOrBusinessRegistrationNumber?: string
  passwordTwoDigits?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<IssueBody>
    const {
      customerId,
      fullName,
      phoneNumber,
      email,
      cardNumber,
      expiryYear,
      expiryMonth,
      birthOrBusinessRegistrationNumber,
      passwordTwoDigits,
    } = body

    if (
      !customerId ||
      !fullName ||
      !phoneNumber ||
      !email ||
      !cardNumber ||
      !expiryYear ||
      !expiryMonth
    ) {
      return NextResponse.json({ error: '필수 입력이 부족합니다.' }, { status: 400 })
    }

    const apiSecret = process.env.PORTONE_API_SECRET
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
    if (!apiSecret || !channelKey) {
      return NextResponse.json({ error: '포트원 설정이 누락되었습니다.' }, { status: 500 })
    }

    const issueRes = await fetch('https://api.portone.io/billing-keys', {
      method: 'POST',
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelKey,
        customer: {
          id: customerId,
          name: { full: fullName },
          phoneNumber,
          email,
        },
        method: {
          card: {
            credential: {
              number: cardNumber,
              expiryYear,
              expiryMonth,
              birthOrBusinessRegistrationNumber,
              passwordTwoDigits,
            },
          },
        },
      }),
    })

    const issueJson = await issueRes.json().catch(() => ({}))
    if (!issueRes.ok) {
      return NextResponse.json(
        { error: issueJson?.message || '빌링키 발급 실패', detail: issueJson },
        { status: 400 }
      )
    }

    return NextResponse.json(issueJson)
  } catch (error: any) {
    console.error('[pay/issue-billing-key] error', error)
    return NextResponse.json({ error: error?.message || 'unknown error' }, { status: 500 })
  }
}
