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
   * 공통 정기구독 처리 로직
   * 카드 결제와 카카오페이 결제에서 공통으로 사용
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

    if (!phoneNumber || !fallbackName) {
      setPendingPlan(plan)
      if (onPhoneRequired) {
        onPhoneRequired(plan)
      }
      return
    }

    setLoading(plan)
    setPayMessage(null)

    // Log payment attempt
    console.info('[Payment] Attempting payment', {
      plan,
      method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
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
        email?: string
        phoneNumber?: string
      }
      
      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
        email: user.email || undefined,
        phoneNumber: phoneNumber || undefined,
      }

      // 카드 결제일 경우 name 필드 추가
      if (config.billingKeyMethod === 'CARD') {
        customerPayload.name = fallbackName
      }

      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId: config.storeId,
        channelKey: config.channelKey,
        billingKeyMethod: config.billingKeyMethod,
        issueId,
        issueName: config.issueName,
        customer: customerPayload,
      })

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
        body: JSON.stringify({ billingKey, plan }),
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
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        testMode: true,
        timestamp: Date.now(),
      })
      
      setPayMessage(config.successMessage)
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, config.issueIdPrefix === 'kko' ? '카카오 구독 결제' : '구독 결제')
      setPayMessage(errorMessage)
    } finally {
      setLoading(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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

    if (!phoneNumber || !fallbackName) {
      setPendingPlan(plan)
      if (onPhoneRequired) {
        onPhoneRequired(plan)
      }
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

      // PortOne SDK 타입 이슈로 인한 타입 단언
      const paymentResponse = await PortOne.requestPayment({
        storeId: config.storeId,
        channelKey: config.channelKey,
        paymentId,
        orderName: `일본어학습 구독권 (${planNames[plan]})`,
        totalAmount: planAmounts[plan],
        currency: 'KRW',
        customer: {
          fullName: fallbackName,
          email: user.email || undefined,
          phoneNumber: phoneNumber || undefined,
        },
      } as any)

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
        method: config.issueIdPrefix === 'kko' ? 'kakao' : 'card',
        timestamp: Date.now(),
      })
      
      setPayMessage('결제가 완료되었습니다.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, config.issueIdPrefix === 'kko' ? '카카오 단건결제' : '단건결제')
      setPayMessage(errorMessage)
    } finally {
      setLoading(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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
