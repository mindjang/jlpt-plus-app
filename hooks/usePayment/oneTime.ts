/**
 * 단건 결제 처리 로직
 */
import { handleError } from '@/lib/utils/error/errorHandler'
import { logger } from '@/lib/utils/logger'
import type { User } from 'firebase/auth'
import type { OneTimePlan, PaymentPlan, BillingKeyConfig, CustomerPayload } from './types'
import { isMobile, validateUserAndGetInfo, createCustomerPayload } from './utils'

interface ProcessOneTimePaymentParams {
  plan: OneTimePlan
  config: BillingKeyConfig
  user: User | null
  phoneNumber: string | undefined
  displayName: string | undefined
  nameInput: string
  setLoading: (loading: PaymentPlan | null) => void
  setPayMessage: (message: string | null) => void
  setPendingPlan: (plan: PaymentPlan | null) => void
  onRefresh?: () => void | Promise<void>
  onPhoneRequired?: (plan: PaymentPlan) => void
}

export async function processOneTimePayment({
  plan,
  config,
  user,
  phoneNumber,
  displayName,
  nameInput,
  setLoading,
  setPayMessage,
  setPendingPlan,
  onRefresh,
  onPhoneRequired,
}: ProcessOneTimePaymentParams): Promise<void> {
  // 사용자 검증 및 기본 정보 가져오기
  const userInfo = validateUserAndGetInfo(
    user,
    phoneNumber,
    displayName,
    nameInput,
    plan,
    setPayMessage,
    setPendingPlan,
    onPhoneRequired
  )
  if (!userInfo) return

  const { fallbackName, mobile } = userInfo

  setLoading(plan)
  setPayMessage(null)

  const uidShort = user!.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
  const ts = Date.now().toString(36)
  const paymentId = `onetime-${plan}-${uidShort}-${ts}`.slice(0, 40)

  try {
    if (typeof window === 'undefined') {
      setPayMessage('결제는 브라우저에서만 가능합니다.')
      return
    }

    const PortOne = await import('@portone/browser-sdk/v2')

    const planAmounts: Record<OneTimePlan, number> = {
      monthly: Number(process.env.NEXT_PUBLIC_PORTONE_ONETIME_MONTHLY_AMOUNT || 6900),
      yearly: Number(process.env.NEXT_PUBLIC_PORTONE_ONETIME_YEARLY_AMOUNT || 69000),
    }

    const planNames: Record<OneTimePlan, string> = {
      monthly: '1개월 이용권',
      yearly: '1년 이용권',
    }

    // 단건 결제 전용: payMethod 설정
    // 카카오페이 전용 버튼인 경우에만 'EASY_PAY' 설정
    // 카드 결제인 경우 'CARD'로 설정 (KG이니시스는 payMethod='CARD'로 설정해도 결제창에서 간편결제 선택 가능)
    let payMethod: string
    if (config.billingKeyMethod === 'EASY_PAY' && config.issueIdPrefix.startsWith('kko')) {
      payMethod = 'EASY_PAY'
    } else {
      // 카드 결제인 경우 'CARD'로 설정
      // KG이니시스는 payMethod='CARD'로 설정해도 결제창에서 간편결제 옵션을 제공함
      payMethod = 'CARD'
    }

    // CustomerPayload 생성
    const customerPayload = createCustomerPayload(user, phoneNumber, fallbackName, config.billingKeyMethod)

    if (!mobile && (!customerPayload.phoneNumber || !customerPayload.email)) {
      logger.warn('[Payment] PC one-time payment requires phoneNumber and email', {
        hasPhoneNumber: !!customerPayload.phoneNumber,
        hasEmail: !!customerPayload.email,
      })
    }

    // 단건 결제 전용: paymentOptions 생성
    const paymentOptions: any = {
      storeId: config.storeId,
      channelKey: config.channelKey,
      paymentId,
      orderName: `일본어학습 구독권 (${planNames[plan]})`,
      totalAmount: planAmounts[plan],
      currency: 'KRW', // KG이니시스 문서 기준: 원화 결제 시 KRW 사용
      payMethod: payMethod, // 단건 결제는 항상 payMethod 필수
      customer: customerPayload,
    }

    // 모바일에서는 redirectUrl 필수
    if (mobile) {
      paymentOptions.redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/my?payment=success`
        : '/my?payment=success'
    }

    const logData = {
      mobile,
      isMobileDetected: isMobile(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      innerWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
      paymentId,
      payMethod: paymentOptions.payMethod,
      originalPayMethod: payMethod,
      hasRedirectUrl: !!paymentOptions.redirectUrl,
      redirectUrl: paymentOptions.redirectUrl,
      storeId: config.storeId,
      channelKey: config.channelKey ? `${config.channelKey.substring(0, 10)}...` : 'missing',
      customer: {
        hasFullName: !!customerPayload.fullName,
        hasEmail: !!customerPayload.email,
        hasPhoneNumber: !!customerPayload.phoneNumber,
      },
      paymentOptionsKeys: Object.keys(paymentOptions),
      timestamp: Date.now(),
    }
    
    logger.info('[Payment] Requesting payment', logData)
    
    // 모바일에서 리다이렉트가 발생하므로 로그를 sessionStorage에 저장
    if (mobile && typeof window !== 'undefined') {
      try {
        const existingLogs = sessionStorage.getItem('paymentLogs')
        const logs = existingLogs ? JSON.parse(existingLogs) : []
        logs.push({
          type: 'request',
          ...logData,
          timestamp: new Date().toISOString(),
        })
        sessionStorage.setItem('paymentLogs', JSON.stringify(logs.slice(-10))) // 최근 10개만 저장
      } catch (e) {
        // sessionStorage 저장 실패 시 무시
      }
    }

    // requestPayment 호출 전 최종 검증 (PC/모바일 공통)
    if (!paymentOptions.payMethod) {
      logger.error('[Payment] payMethod is missing before requestPayment', {
        paymentOptions,
        payMethod,
        mobile,
        config: config.billingKeyMethod,
        issueIdPrefix: config.issueIdPrefix,
      })
      setPayMessage('결제 설정에 오류가 있습니다. 다시 시도해주세요.')
      return
    }
    
    // 모바일에서는 redirectUrl 필수
    if (mobile) {
      if (!paymentOptions.redirectUrl) {
        logger.error('[Payment] redirectUrl is missing for mobile payment', {
          paymentOptions,
          mobile,
        })
        setPayMessage('결제 설정에 오류가 있습니다. 다시 시도해주세요.')
        return
      }
      
      // 모바일 결제 전 최종 로깅 (실제 전송되는 데이터 확인)
      logger.info('[Payment] Mobile payment options (final)', {
        payMethod: paymentOptions.payMethod,
        redirectUrl: paymentOptions.redirectUrl,
        storeId: paymentOptions.storeId,
        channelKey: paymentOptions.channelKey ? `${paymentOptions.channelKey.substring(0, 10)}...` : 'missing',
        paymentId: paymentOptions.paymentId,
        totalAmount: paymentOptions.totalAmount,
        currency: paymentOptions.currency,
        hasCustomer: !!paymentOptions.customer,
        customerKeys: paymentOptions.customer ? Object.keys(paymentOptions.customer) : [],
        allKeys: Object.keys(paymentOptions),
      })
    } else {
      // PC 결제 전 최종 로깅
      logger.info('[Payment] PC payment options (final)', {
        payMethod: paymentOptions.payMethod,
        storeId: paymentOptions.storeId,
        channelKey: paymentOptions.channelKey ? `${paymentOptions.channelKey.substring(0, 10)}...` : 'missing',
        paymentId: paymentOptions.paymentId,
        totalAmount: paymentOptions.totalAmount,
        currency: paymentOptions.currency,
        hasCustomer: !!paymentOptions.customer,
        customerKeys: paymentOptions.customer ? Object.keys(paymentOptions.customer) : [],
        allKeys: Object.keys(paymentOptions),
      })
    }

    // 모바일에서는 리다이렉션이 발생하므로 requestPayment 호출 후 바로 리다이렉트됨
    // PC에서는 팝업이 열리고 응답을 받음
    try {
      const paymentResponse = await PortOne.requestPayment(paymentOptions)
      
      // 모바일에서는 리다이렉션이 발생하므로 여기까지 도달하지 않음
      // PC에서만 여기까지 도달
      if (!paymentResponse) {
        setPayMessage('결제 응답을 받지 못했습니다.')
        return
      }

      if ((paymentResponse as any).code) {
        setPayMessage((paymentResponse as any).message || '결제에 실패했습니다.')
        return
      }

      const actualPaymentId = (paymentResponse as any).paymentId || paymentId
      const idToken = await user!.getIdToken()

      const resp = await fetch('/api/pay/one-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ paymentId: actualPaymentId, plan }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        logger.error('[Payment] One-time payment API failed', {
          plan,
          error: data?.error,
          timestamp: Date.now(),
        })
        setPayMessage(data?.error || '결제에 실패했습니다.')
        return
      }

      logger.info('[Payment] One-time payment completed successfully', {
        plan,
        method: config.billingKeyMethod === 'EASY_PAY' ? 'easy_pay' : 'card',
        device: mobile ? 'mobile' : 'pc',
        timestamp: Date.now(),
      })

      setPayMessage('결제가 완료되었습니다.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (requestError: any) {
      // 모바일에서 requestPayment 호출 시 에러가 발생하면 리다이렉션이 발생하지 않음
      const errorLogData = {
        error: requestError?.message || String(requestError),
        errorCode: requestError?.code,
        errorName: requestError?.name,
        stack: requestError?.stack,
        mobile,
        paymentId,
        paymentOptions: {
          ...paymentOptions,
          channelKey: paymentOptions.channelKey ? `${paymentOptions.channelKey.substring(0, 10)}...` : 'missing',
        },
        timestamp: Date.now(),
      }
      
      logger.error('[Payment] PortOne requestPayment failed', errorLogData)
      
      // 모바일에서 에러 발생 시 로그를 sessionStorage에 저장
      if (mobile && typeof window !== 'undefined') {
        try {
          const existingLogs = sessionStorage.getItem('paymentLogs')
          const logs = existingLogs ? JSON.parse(existingLogs) : []
          logs.push({
            type: 'error',
            ...errorLogData,
            timestamp: new Date().toISOString(),
          })
          sessionStorage.setItem('paymentLogs', JSON.stringify(logs.slice(-10))) // 최근 10개만 저장
        } catch (e) {
          // sessionStorage 저장 실패 시 무시
        }
      }
      
      throw requestError
    }
  } catch (error: any) {
    logger.error('[Payment] One-time payment error', {
      error: error?.message || String(error),
      errorCode: error?.code,
      errorName: error?.name,
      stack: error?.stack,
      mobile,
      paymentId,
      plan,
      timestamp: Date.now(),
    })
    
    const errorMessage = handleError(error, config.billingKeyMethod === 'EASY_PAY' ? '간편결제' : '단건결제')
    
    if (mobile && (error?.message?.includes('popup') || error?.message?.includes('window') || error?.code === 'POPUP_BLOCKED')) {
      setPayMessage('결제창이 열리지 않습니다. 브라우저 팝업 차단 설정을 확인해주세요.')
    } else {
      setPayMessage(errorMessage)
    }
  } finally {
    setLoading(null)
  }
}

