/**
 * 결제 로직 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import { handleError } from '@/lib/utils/error/errorHandler'
import type { User } from 'firebase/auth'

interface UsePaymentOptions {
  user: User | null
  phoneNumber: string | undefined
  displayName: string | undefined
  nameInput: string
  onRefresh?: () => void | Promise<void>
  onPhoneRequired?: (plan: 'monthly' | 'yearly') => void
}

interface UsePaymentResult {
  payLoading: 'monthly' | 'yearly' | null
  payLoadingKakao: 'monthly' | 'yearly' | null
  payMessage: string | null
  pendingPlan: 'monthly' | 'yearly' | null
  setPayMessage: (message: string | null) => void
  setPendingPlan: (plan: 'monthly' | 'yearly' | null) => void
  handleSubscribe: (plan: 'monthly' | 'yearly') => Promise<void>
  handleSubscribeKakao: (plan: 'monthly' | 'yearly') => Promise<void>
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
  const [payLoading, setPayLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [payLoadingKakao, setPayLoadingKakao] = useState<'monthly' | 'yearly' | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | null>(null)

  /**
   * 공통 구독 처리 로직
   * 카드 결제와 카카오페이 결제에서 공통으로 사용
   */
  const processSubscription = useCallback(async (
    plan: 'monthly' | 'yearly',
    config: BillingKeyConfig,
    setLoading: (loading: 'monthly' | 'yearly' | null) => void
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
        timestamp: Date.now(),
      })
      
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken()
      
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
          error: data?.error,
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

  const handleSubscribe = useCallback(async (plan: 'monthly' | 'yearly') => {
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
      issueIdPrefix: 'bill',
      issueName: plan === 'monthly' ? '월간 구독 빌링키 발급' : '연간 구독 빌링키 발급',
      errorMessage: '빌링키 발급에 실패했습니다.',
      successMessage: '구독이 활성화되었습니다.',
    }

    await processSubscription(plan, config, setPayLoading)
  }, [processSubscription])

  const handleSubscribeKakao = useCallback(async (plan: 'monthly' | 'yearly') => {
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
      issueIdPrefix: 'kko',
      issueName: plan === 'monthly' ? '카카오페이 월 구독' : '카카오페이 연간 구독',
      errorMessage: '카카오 빌링키 발급에 실패했습니다.',
      successMessage: '카카오 구독이 활성화되었습니다.',
    }

    await processSubscription(plan, config, setPayLoadingKakao)
  }, [processSubscription])

  return {
    payLoading,
    payLoadingKakao,
    payMessage,
    pendingPlan,
    setPayMessage,
    setPendingPlan,
    handleSubscribe,
    handleSubscribeKakao,
  }
}
