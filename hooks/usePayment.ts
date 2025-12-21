/**
 * 결제 로직 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import { handleError } from '@/lib/utils/error/errorHandler'
import type { User } from 'firebase/auth'

type SubscriptionPlan = 'monthly' | 'quarterly' // 정기구독: 1개월, 3개월
type OneTimePlan = 'monthly' | 'yearly' // 단건결제: 1개월, 1년
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

type PaymentMethod = 'card' | 'kakao'

interface BillingKeyConfig {
  storeId: string
  channelKey: string
  billingKeyMethod: 'CARD' | 'EASY_PAY'
  issueIdPrefix: string
  issueName: string
  errorMessage: string
  successMessage: string
}

/**
 * 결제 로직을 관리하는 커스텀 훅
 */
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

  /**
   * PC/모바일 감지 유틸리티
   */
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768
  }, [])

  /**
   * 공통 정기구독 처리 로직
   * 카드 결제와 간편결제(카카오페이 등)에서 공통으로 사용
   * PC와 모바일 모두 지원
   */
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
    
    // PC에서는 phoneNumber, email 필수 (KG이니시스 요구사항)
    // 모바일에서는 optional
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

    // Log payment attempt
    console.info('[Payment] Attempting payment', {
      plan,
      method: config.issueIdPrefix === 'kko' ? 'easy_pay' : 'card',
      device: mobile ? 'mobile' : 'pc',
      testMode: true,
      timestamp: Date.now(),
    })

    try {
      const PortOne = await import('@portone/browser-sdk/v2')
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `${config.issueIdPrefix}-${plan}-${uidShort}-${ts}`.slice(0, 40)
      
      interface CustomerPayload {
        fullName: string
        name?: string
        firstName?: string
        lastName?: string
        email?: string
        phoneNumber?: string
      }
      
      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
      }

      // PC에서는 필수, 모바일에서는 optional
      if (user.email) {
        customerPayload.email = user.email
      }
      if (phoneNumber) {
        customerPayload.phoneNumber = phoneNumber
      }

      // 카드 결제일 경우 name 필드 추가 (KG이니시스 요구사항)
      if (config.billingKeyMethod === 'CARD') {
        customerPayload.name = fallbackName
        // KG이니시스는 fullName 또는 (firstName + lastName) 필수
        // fullName이 이미 있으므로 추가 처리 불필요
      }

      // 모바일 빌링키 발급 시 offerPeriod 필수 (카드 및 간편결제 모두)
      const billingKeyOptions: any = {
        storeId: config.storeId,
        channelKey: config.channelKey,
        billingKeyMethod: config.billingKeyMethod,
        issueId,
        issueName: config.issueName,
        customer: customerPayload,
      }

      // 모바일 감지 재확인 (더 정확한 감지를 위해)
      const isDefinitelyMobile = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768
      )

      // 모바일에서는 offerPeriod 필수 (KG이니시스 V2 요구사항)
      // mobile 변수와 isDefinitelyMobile 둘 다 확인하여 안전하게 처리
      if (mobile || isDefinitelyMobile) {
        console.info('[Payment] Mobile detected, adding offerPeriod', {
          mobile,
          isDefinitelyMobile,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
          innerWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
        })
        // PortOne 문서에 따르면 offerPeriod는 range 객체 안에 from과 to 필드를 사용
        billingKeyOptions.offerPeriod = {
          range: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1년 후
          }
        }
        // 모바일에서는 리디렉션 URL도 필수
        billingKeyOptions.redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/my?payment=success`
          : '/my?payment=success'
      } else {
        console.info('[Payment] PC detected, skipping offerPeriod', {
          mobile,
          isDefinitelyMobile,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
          innerWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
        })
      }

      const issueResponse = await PortOne.requestIssueBillingKey(billingKeyOptions)

      interface IssueResponse {
        code?: string
        message?: string
        billingKey?: string
      }

      const response = issueResponse as IssueResponse
      if (response.code !== undefined) {
        console.warn('[Payment] Billing key issue failed', {
          plan,
          method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
          error: response.message,
          timestamp: Date.now(),
        })
        setPayMessage(response.message || config.errorMessage)
        return
      }

      const billingKey = response.billingKey as string
      console.info('[Payment] Billing key issued successfully', {
        plan,
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        billingKeyLength: billingKey?.length,
        billingKeyPrefix: billingKey?.substring(0, 20),
        timestamp: Date.now(),
      })
      
      if (!billingKey || billingKey.trim() === '') {
        console.error('[Payment] Billing key is empty', {
          plan,
          method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
          response,
        })
        setPayMessage('빌링키를 받지 못했습니다. 다시 시도해주세요.')
        return
      }
      
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken()
      
      console.info('[Payment] Calling subscribe API', {
        plan,
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        hasBillingKey: !!billingKey,
        billingKeyLength: billingKey?.length,
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
          paymentMethod: config.billingKeyMethod, // 결제 수단 전달
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        console.error('[Payment] Subscription API failed', {
          plan,
          status: resp.status,
          error: data?.error,
          detail: data?.detail,
          received: data?.received,
          timestamp: Date.now(),
        })
        setPayMessage(data?.error || '구독 결제에 실패했습니다.')
        return
      }
      
      console.info('[Payment] Subscription completed successfully', {
        plan,
        method: config.billingKeyMethod === 'EASY_PAY' ? 'easy_pay' : 'card',
        device: isMobile() ? 'mobile' : 'pc',
        testMode: true,
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
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
    
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

  /**
   * 단건결제 처리 로직
   * PC와 모바일 모두 지원, 카드 및 간편결제 지원
   */
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
    
    // PC에서는 phoneNumber, email 필수 (KG이니시스 요구사항)
    // 모바일에서는 optional
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

    try {
      const PortOne = await import('@portone/browser-sdk/v2')
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const paymentId = `onetime-${plan}-${uidShort}-${ts}`.slice(0, 40)

      const planAmounts: Record<OneTimePlan, number> = {
        monthly: Number(process.env.NEXT_PUBLIC_PORTONE_ONETIME_MONTHLY_AMOUNT || 4900),
        yearly: Number(process.env.NEXT_PUBLIC_PORTONE_ONETIME_YEARLY_AMOUNT || 49000),
      }

      const planNames: Record<OneTimePlan, string> = {
        monthly: '1개월 이용권',
        yearly: '1년 이용권',
      }

      // PC와 모바일 모두에서 payMethod를 지정하지 않으면 결제창에서 카드/간편결제 선택 가능
      // 카카오페이 버튼을 통한 결제가 아닌 경우에만 undefined로 설정
      const payMethod = config.billingKeyMethod === 'EASY_PAY' && config.issueIdPrefix.startsWith('kko')
        ? 'EASY_PAY' // 카카오페이 전용 버튼을 통한 결제인 경우에만 명시적으로 지정
        : undefined // 그 외의 경우는 undefined로 하여 결제창에서 선택 가능

      interface CustomerPayload {
        fullName: string
        name?: string
        firstName?: string
        lastName?: string
        email?: string
        phoneNumber?: string
      }

      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
      }

      // PC에서는 필수, 모바일에서는 optional
      if (user.email) {
        customerPayload.email = user.email
      }
      if (phoneNumber) {
        customerPayload.phoneNumber = phoneNumber
      }

      // 카드 결제일 경우 name 필드 추가 (KG이니시스 요구사항)
      // payMethod가 undefined일 때는 결제창에서 선택할 수 있으므로 name 필드를 추가하는 것이 안전
      // payMethod가 'EASY_PAY'가 아닐 때 (undefined 또는 'CARD') name 필드 추가
      if (!payMethod || payMethod !== 'EASY_PAY') {
        customerPayload.name = fallbackName
      }

      // PortOne SDK 결제 요청
      const paymentOptions: any = {
        storeId: config.storeId,
        channelKey: config.channelKey,
        paymentId,
        orderName: `일본어학습 구독권 (${planNames[plan]})`,
        totalAmount: planAmounts[plan],
        currency: 'KRW',
        customer: customerPayload,
      }

      // payMethod를 지정하지 않으면 결제창에서 카드/간편결제 모두 선택 가능
      // 카카오페이 전용 버튼을 통한 결제인 경우에만 명시적으로 지정
      if (payMethod) {
        paymentOptions.payMethod = payMethod
      }
      // 그 외의 경우는 payMethod를 지정하지 않아 KG이니시스 결제창에서 카드/간편결제 선택 가능

      // 모바일에서는 리디렉션 URL 필수
      if (mobile) {
        paymentOptions.redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/my?payment=success`
          : '/my?payment=success'
      }

      const paymentResponse = await PortOne.requestPayment(paymentOptions)

      if (!paymentResponse) {
        setPayMessage('결제 응답을 받지 못했습니다.')
        return
      }

      if ((paymentResponse as any).code) {
        setPayMessage((paymentResponse as any).message || '결제에 실패했습니다.')
        return
      }

      // 실제 결제 ID 가져오기 (PortOne 응답에서)
      const actualPaymentId = (paymentResponse as any).paymentId || paymentId

      // Firebase ID 토큰 가져오기
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
        console.error('[Payment] One-time payment API failed', {
          plan,
          error: data?.error,
          timestamp: Date.now(),
        })
        setPayMessage(data?.error || '결제에 실패했습니다.')
        return
      }
      
      console.info('[Payment] One-time payment completed successfully', {
        plan,
        method: config.billingKeyMethod === 'EASY_PAY' ? 'easy_pay' : 'card',
        device: mobile ? 'mobile' : 'pc',
        timestamp: Date.now(),
      })
      
      setPayMessage('결제가 완료되었습니다.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, config.billingKeyMethod === 'EASY_PAY' ? '간편결제' : '단건결제')
      setPayMessage(errorMessage)
    } finally {
      setLoading(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired, isMobile])

  const handleOneTimePayment = useCallback(async (plan: OneTimePlan) => {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
    
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
