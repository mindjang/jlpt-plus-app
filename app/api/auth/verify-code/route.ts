import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { logger } from '@/lib/utils/logger'

/**
 * 이메일 인증번호 검증 API
 * POST /api/auth/verify-code
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: '인증번호가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      logger.error('[EmailVerification] Firestore not initialized')
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    // Firestore에서 인증번호 조회
    const verificationRef = adminDb.collection('emailVerifications').doc(email)
    const verificationDoc = await verificationRef.get()

    if (!verificationDoc.exists) {
      return NextResponse.json(
        { error: '인증번호가 만료되었거나 존재하지 않습니다.' },
        { status: 400 }
      )
    }

    const verificationData = verificationDoc.data()
    if (!verificationData) {
      return NextResponse.json(
        { error: '인증번호 데이터를 찾을 수 없습니다.' },
        { status: 400 }
      )
    }

    // 만료 시간 확인
    if (Date.now() > verificationData.expiresAt) {
      await verificationRef.delete()
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 발송해주세요.' },
        { status: 400 }
      )
    }

    // 시도 횟수 확인 (5회 초과 시 차단)
    if (verificationData.attempts >= 5) {
      await verificationRef.delete()
      return NextResponse.json(
        { error: '인증번호 시도 횟수를 초과했습니다. 다시 발송해주세요.' },
        { status: 400 }
      )
    }

    // 인증번호 확인
    if (verificationData.code !== code) {
      // 시도 횟수 증가
      await verificationRef.update({
        attempts: (verificationData.attempts || 0) + 1,
      })
      return NextResponse.json(
        { error: '인증번호가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 인증 성공 - 인증번호 삭제
    await verificationRef.delete()

    logger.info('[EmailVerification] Code verified successfully', { email })

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
    })
  } catch (error) {
    logger.error('[EmailVerification] Failed to verify code', error)
    return NextResponse.json(
      { error: '인증번호 확인에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

