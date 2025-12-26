/**
 * 정기 결제 처리 로직
 */
import { handleError } from '@/lib/utils/error/errorHandler'
import { logger } from '@/lib/utils/logger'
import type { User } from 'firebase/auth'
import type { SubscriptionPlan, PaymentPlan, BillingKeyConfig, CustomerPayload } from './types'
import { isMobile, validateUserAndGetInfo, createCustomerPayload } from './utils'

interface ProcessSubscriptionParams {
  plan: SubscriptionPlan
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

export async function processSubscription({
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
}: ProcessSubscriptionParams): Promise<void> {
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

  logger.info('[Payment] Attempting subscription payment', {
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
    const uidShort = user!.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
    const ts = Date.now().toString(36)
    const issueId = `${config.issueIdPrefix}-${plan}-${uidShort}-${ts}`.slice(0, 40)

    // CustomerPayload 생성
    const customerPayload = createCustomerPayload(user, phoneNumber, fallbackName, config.billingKeyMethod)

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

    const idToken = await user!.getIdToken()

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
          email: user!.email || undefined,
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
}

