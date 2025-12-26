/**
 * 결제 로직 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import { handleError } from '@/lib/utils/error/errorHandler'
import { logger } from '@/lib/utils/logger'
import type { User } from 'firebase/auth'

type SubscriptionPlan = 'monthly' | 'quarterly'
type OneTimePlan = 'monthly' | 'yearly'
type PaymentPlan = SubscriptionPlan | OneTimePlan

interface UsePaymentOptions {
  user: User | null
  phoneNumber: string | undefined
  displayName: string | undefined
  nameInput: string
  onRefresh?: () => void | Promise<void>
  onPhoneRequired?: (plan: PaymentPlan) => void
}

interface UsePaymentResult {
  payLoading: PaymentPlan | null
  payLoadingKakao: PaymentPlan | null
  payMessage: string | null
  pendingPlan: PaymentPlan | null
  setPayMessage: (message: string | null) => void
  setPendingPlan: (plan: PaymentPlan | null) => void
  handleSubscribe: (plan: SubscriptionPlan) => Promise<void>
  handleSubscribeKakao: (plan: SubscriptionPlan) => Promise<void>
  handleOneTimePayment: (plan: OneTimePlan) => Promise<void>
  handleOneTimePaymentKakao: (plan: OneTimePlan) => Promise<void>
}

interface BillingKeyConfig {
  storeId: string
  channelKey: string
  billingKeyMethod: 'CARD' | 'EASY_PAY'
  issueIdPrefix: string
  issueName: string
  errorMessage: string
  successMessage: string
}

interface CustomerPayload {
  fullName: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
}

export function usePayment({
  user,
  phoneNumber,
  displayName,
  nameInput,
  onRefresh,
  onPhoneRequired,
}: UsePaymentOptions): UsePaymentResult {
  const [payLoading, setPayLoading] = useState<PaymentPlan | null>(null)
  const [payLoadingKakao, setPayLoadingKakao] = useState<PaymentPlan | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<PaymentPlan | null>(null)

  const isMobile = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
  }, [])

  const processSubscription = useCallback(async (
    plan: SubscriptionPlan,
    config: BillingKeyConfig,
    setLoading: (loading: PaymentPlan | null) => void
  ) => {
    if (!user) return
    if (!user.email) {
      setPayMessage('이메일 정보가 필요합니다. 계정에 이메일이 있는지 확인해주세요.')
      return
    }

    const fallbackName =
      (displayName || nameInput || user.displayName || (user.email ? user.email.split('@')[0] : '') || '사용자').trim() ||
      '사용자'

    const mobile = isMobile()

    if (!mobile && (!phoneNumber || !user.email)) {
      setPendingPlan(plan)
      if (onPhoneRequired) {
        onPhoneRequired(plan)
      }
      return
    }

    if (!fallbackName) {
      setPayMessage('이름 정보가 필요합니다.')
      return
    }

    setLoading(plan)
    setPayMessage(null)

    logger.info('[Payment] Attempting payment', {
      plan,
      method: config.issueIdPrefix === 'kko' ? 'easy_pay' : 'card',
      device: mobile ? 'mobile' : 'pc',
      timestamp: Date.now(),
    })

    try {
      if (typeof window === 'undefined') {
        setPayMessage('결제는 브라우저에서만 가능합니다.')
        setLoading(null)
        return
      }

      const PortOne = await import('@portone/browser-sdk/v2')
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `${config.issueIdPrefix}-${plan}-${uidShort}-${ts}`.slice(0, 40)

      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
      }

      if (user.email) {
        customerPayload.email = user.email
      }
      if (phoneNumber) {
        customerPayload.phoneNumber = phoneNumber
      }

      if (config.billingKeyMethod === 'CARD') {
        customerPayload.name = fallbackName
      }

      const billingKeyOptions: any = {
        storeId: config.storeId,
        channelKey: config.channelKey,
        billingKeyMethod: config.billingKeyMethod,
        issueId,
        issueName: config.issueName,
        customer: customerPayload,
      }

      if (mobile) {
        billingKeyOptions.offerPeriod = {
          range: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        }
        const redirectParams = new URLSearchParams({
          payment: 'success',
          plan: plan,
          paymentMethod: config.billingKeyMethod,
        })
        billingKeyOptions.redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/my?${redirectParams.toString()}`
          : `/my?${redirectParams.toString()}`
      }

      const issueResponse = await PortOne.requestIssueBillingKey(billingKeyOptions)

      interface IssueResponse {
        code?: string
        message?: string
        billingKey?: string
      }

      const response = issueResponse as IssueResponse

      let easyPayProvider: string | undefined = undefined
      if (config.billingKeyMethod === 'EASY_PAY') {
        if (config.issueIdPrefix === 'kko') {
          easyPayProvider = 'KAKAOPAY'
        } else {
          const responseProvider = (response as any)?.easyPay?.provider ||
            (response as any)?.provider ||
            (response as any)?.method?.provider
          if (responseProvider) {
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
            easyPayProvider = providerMap[responseProvider.toUpperCase()] || 'OTHER'
          }
        }
      }

      if (mobile && (!response.billingKey || response.billingKey.trim() === '')) {
        logger.info('[Payment] Mobile redirect occurred', {
          plan,
          method: config.billingKeyMethod === 'EASY_PAY' ? 'easy_pay' : 'card',
          redirectUrl: billingKeyOptions.redirectUrl,
          timestamp: Date.now(),
        })
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingPayment', JSON.stringify({
            plan,
            paymentMethod: config.billingKeyMethod,
            easyPayProvider,
            timestamp: Date.now(),
          }))
        }
        setPayMessage('결제를 진행 중입니다...')
        return
      }

      if (response.code !== undefined) {
        logger.warn('[Payment] Billing key issue failed', {
          plan,
          method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
          error: response.message,
          timestamp: Date.now(),
        })
        setPayMessage(response.message || config.errorMessage)
        return
      }

      const billingKey = response.billingKey as string
      logger.info('[Payment] Billing key issued successfully', {
        plan,
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        billingKeyLength: billingKey?.length,
        timestamp: Date.now(),
      })

      if (!billingKey || billingKey.trim() === '') {
        logger.error('[Payment] Billing key is empty', {
          plan,
          method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
          response,
        })
        setPayMessage('빌링키를 받지 못했습니다. 다시 시도해주세요.')
        return
      }

      const idToken = await user.getIdToken()

      logger.info('[Payment] Calling subscribe API', {
        plan,
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        hasBillingKey: !!billingKey,
        timestamp: Date.now(),
      })

      const resp = await fetch('/api/pay/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          billingKey,
          plan,
          paymentMethod: config.billingKeyMethod,
          easyPayProvider,
          customer: {
            fullName: fallbackName,
            email: user.email || undefined,
            phoneNumber: phoneNumber || undefined,
          },
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        logger.error('[Payment] Subscription API failed', {
          plan,
          status: resp.status,
          error: data?.error,
          detail: data?.detail,
          timestamp: Date.now(),
        })
        setPayMessage(data?.error || '구독 결제에 실패했습니다.')
        return
      }

      logger.info('[Payment] Subscription completed successfully', {
        plan,
        method: config.billingKeyMethod === 'EASY_PAY' ? 'easy_pay' : 'card',
        device: isMobile() ? 'mobile' : 'pc',
        timestamp: Date.now(),
      })

      setPayMessage(config.successMessage)
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, config.billingKeyMethod === 'EASY_PAY' ? '간편결제 구독' : '구독 결제')
      setPayMessage(errorMessage)
    } finally {
      setLoading(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired, isMobile])

  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD_SUBSCRIPTION || process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

    if (!storeId || !channelKey) {
      setPayMessage('결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }

    const planNames: Record<SubscriptionPlan, string> = {
      monthly: '1개월 구독',
      quarterly: '3개월 구독',
    }

    const config: BillingKeyConfig = {
      storeId,
      channelKey,
      billingKeyMethod: 'CARD',
      issueIdPrefix: 'bill',
      issueName: `${planNames[plan]} 빌링키 발급`,
      errorMessage: '빌링키 발급에 실패했습니다.',
      successMessage: '구독이 활성화되었습니다.',
    }

    await processSubscription(plan, config, setPayLoading)
  }, [processSubscription])

  const handleSubscribeKakao = useCallback(async (plan: SubscriptionPlan) => {
    const channelKeyKakao = process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID

    if (!storeId || !channelKeyKakao) {
      setPayMessage('카카오 결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }

    const planNames: Record<SubscriptionPlan, string> = {
      monthly: '1개월 구독',
      quarterly: '3개월 구독',
    }

    const config: BillingKeyConfig = {
      storeId,
      channelKey: channelKeyKakao,
      billingKeyMethod: 'EASY_PAY',
      issueIdPrefix: 'kko',
      issueName: `카카오페이 ${planNames[plan]}`,
      errorMessage: '카카오 빌링키 발급에 실패했습니다.',
      successMessage: '카카오 구독이 활성화되었습니다.',
    }

    await processSubscription(plan, config, setPayLoadingKakao)
  }, [processSubscription])

  const processOneTimePayment = useCallback(async (
    plan: OneTimePlan,
    config: BillingKeyConfig,
    setLoading: (loading: PaymentPlan | null) => void
  ) => {
    if (!user) return
    if (!user.email) {
      setPayMessage('이메일 정보가 필요합니다. 계정에 이메일이 있는지 확인해주세요.')
      return
    }

    const fallbackName =
      (displayName || nameInput || user.displayName || (user.email ? user.email.split('@')[0] : '') || '사용자').trim() ||
      '사용자'

    const mobile = isMobile()

    if (!mobile && (!phoneNumber || !user.email)) {
      setPendingPlan(plan)
      if (onPhoneRequired) {
        onPhoneRequired(plan)
      }
      return
    }

    if (!fallbackName) {
      setPayMessage('이름 정보가 필요합니다.')
      return
    }

    setLoading(plan)
    setPayMessage(null)

    const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
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

      let payMethod: string | undefined
      if (config.billingKeyMethod === 'EASY_PAY' && config.issueIdPrefix.startsWith('kko')) {
        payMethod = 'EASY_PAY'
      }

      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
      }

      if (user.email) {
        customerPayload.email = user.email
      }
      if (phoneNumber) {
        customerPayload.phoneNumber = phoneNumber
      }

      if (!mobile && (!customerPayload.phoneNumber || !customerPayload.email)) {
        logger.warn('[Payment] PC payment requires phoneNumber and email', {
          hasPhoneNumber: !!customerPayload.phoneNumber,
          hasEmail: !!customerPayload.email,
        })
      }

      const paymentOptions: any = {
        storeId: config.storeId,
        channelKey: config.channelKey,
        paymentId,
        orderName: `일본어학습 구독권 (${planNames[plan]})`,
        totalAmount: planAmounts[plan],
        currency: 'KRW',
        customer: customerPayload,
      }

      if (payMethod) {
        paymentOptions.payMethod = payMethod
      }

      if (mobile) {
        paymentOptions.redirectUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/my?payment=success`
          : '/my?payment=success'
      }

      logger.info('[Payment] Requesting payment', {
        mobile,
        paymentId,
        payMethod,
        hasRedirectUrl: !!paymentOptions.redirectUrl,
        redirectUrl: paymentOptions.redirectUrl,
        storeId: config.storeId,
        channelKey: config.channelKey ? `${config.channelKey.substring(0, 10)}...` : 'missing',
        timestamp: Date.now(),
      })

      try {
        const paymentResponse = await PortOne.requestPayment(paymentOptions)
        
        if (!paymentResponse) {
          setPayMessage('결제 응답을 받지 못했습니다.')
          return
        }

        if ((paymentResponse as any).code) {
          setPayMessage((paymentResponse as any).message || '결제에 실패했습니다.')
          return
        }

        const actualPaymentId = (paymentResponse as any).paymentId || paymentId
        const idToken = await user.getIdToken()

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
        logger.error('[Payment] PortOne requestPayment failed', {
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
        })
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
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired, isMobile])

  const handleOneTimePayment = useCallback(async (plan: OneTimePlan) => {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD_GENERAL || process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

    if (!storeId || !channelKey) {
      setPayMessage('결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }

    const config: BillingKeyConfig = {
      storeId,
      channelKey,
      billingKeyMethod: 'CARD',
      issueIdPrefix: 'onetime',
      issueName: plan === 'monthly' ? '1개월 이용권 결제' : '1년 이용권 결제',
      errorMessage: '결제에 실패했습니다.',
      successMessage: '결제가 완료되었습니다.',
    }

    await processOneTimePayment(plan, config, setPayLoading)
  }, [processOneTimePayment])

  const handleOneTimePaymentKakao = useCallback(async (plan: OneTimePlan) => {
    const channelKeyKakao = process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID

    if (!storeId || !channelKeyKakao) {
      setPayMessage('카카오 결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }

    const config: BillingKeyConfig = {
      storeId,
      channelKey: channelKeyKakao,
      billingKeyMethod: 'EASY_PAY',
      issueIdPrefix: 'kko-onetime',
      issueName: plan === 'monthly' ? '카카오페이 1개월 이용권' : '카카오페이 1년 이용권',
      errorMessage: '카카오 결제에 실패했습니다.',
      successMessage: '카카오 결제가 완료되었습니다.',
    }

    await processOneTimePayment(plan, config, setPayLoadingKakao)
  }, [processOneTimePayment])

  return {
    payLoading,
    payLoadingKakao,
    payMessage,
    pendingPlan,
    setPayMessage,
    setPendingPlan,
    handleSubscribe,
    handleSubscribeKakao,
    handleOneTimePayment,
    handleOneTimePaymentKakao,
  }
}
