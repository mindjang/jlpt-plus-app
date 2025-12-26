import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { adminDb } from '@/lib/firebase/admin'
import { logger } from '@/lib/utils/logger'

/**
 * 6자리 인증번호 생성
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 이메일 인증번호 발송 API
 * POST /api/auth/send-verification-code
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 인증번호 생성
    const code = generateVerificationCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10분 유효

    // Firestore에 인증번호 저장
    if (adminDb) {
      const verificationRef = adminDb.collection('emailVerifications').doc(email)
      await verificationRef.set({
        code,
        expiresAt,
        createdAt: Date.now(),
        attempts: 0, // 시도 횟수
      })
    } else {
      logger.error('[EmailVerification] Firestore not initialized')
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    // Gmail 설정이 없으면 개발 모드로 동작
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      logger.warn('[EmailVerification] Email credentials not configured, skipping email send')
      logger.info('[EmailVerification] Code generated (dev mode)', { email, code })
      
      // 개발 모드에서는 코드만 반환
      return NextResponse.json({
        success: true,
        message: '인증번호가 생성되었습니다. (개발 모드)',
        code: process.env.NODE_ENV === 'development' ? code : undefined, // 개발 모드에서만 코드 반환
      })
    }

    // 이메일 발송
    logger.info('[EmailVerification] Attempting to send email', {
      email,
      from: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_APP_PASSWORD,
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gmail 주소
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail 앱 비밀번호
      },
    })

    // SMTP 연결 검증
    try {
      await transporter.verify()
      logger.info('[EmailVerification] SMTP connection verified')
    } catch (verifyError) {
      logger.error('[EmailVerification] SMTP verification failed', {
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
        stack: verifyError instanceof Error ? verifyError.stack : undefined,
      })
      throw new Error(`SMTP 연결 실패: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`)
    }

    const mailOptions = {
      from: `"MoguJLPT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '[MoguJLPT] 이메일 인증번호',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">이메일 인증번호</h2>
          <p style="color: #666; font-size: 16px;">안녕하세요, MoguJLPT입니다.</p>
          <p style="color: #666; font-size: 16px;">회원가입을 위한 이메일 인증번호입니다.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px; margin: 0;">
              ${code}
            </p>
          </div>
          <p style="color: #999; font-size: 14px;">이 인증번호는 10분간 유효합니다.</p>
          <p style="color: #999; font-size: 14px;">본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.</p>
        </div>
      `,
    }

    const sendResult = await transporter.sendMail(mailOptions)
    logger.info('[EmailVerification] Verification code sent successfully', {
      email,
      messageId: sendResult.messageId,
      response: sendResult.response,
    })

    return NextResponse.json({
      success: true,
      message: '인증번호가 이메일로 발송되었습니다.',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    logger.error('[EmailVerification] Failed to send verification code', {
      error: errorMessage,
      stack: errorStack,
      email: request.body ? 'provided' : 'not provided',
    })
    
    // 더 구체적인 에러 메시지 제공
    let userMessage = '인증번호 발송에 실패했습니다. 다시 시도해주세요.'
    if (errorMessage.includes('SMTP')) {
      userMessage = '이메일 서버 연결에 실패했습니다. 관리자에게 문의해주세요.'
    } else if (errorMessage.includes('authentication')) {
      userMessage = '이메일 인증에 실패했습니다. Gmail 설정을 확인해주세요.'
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    )
  }
}

