/**
 * 결제 로직 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import { handleError } from '@/lib/utils/errorHandler'
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

  const handleSubscribe = useCallback(async (plan: 'monthly' | 'yearly') => {
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

    setPayLoading(plan)
    setPayMessage(null)

    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
      if (!storeId || !channelKey) {
        setPayMessage('결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
        return
      }

      const PortOne = await import('@portone/browser-sdk/v2')
      // issueId는 ASCII, 최대 40자 제한 (이니시스 V2)
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `bill-${plan}-${uidShort}-${ts}`.slice(0, 40)
      const issueName = plan === 'monthly' ? '월간 구독 빌링키 발급' : '연간 구독 빌링키 발급'
      
      interface CustomerPayload {
        fullName: string
        name: string
        email?: string
        phoneNumber?: string
      }
      
      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
        name: fallbackName,
        email: user.email || undefined,
        phoneNumber: phoneNumber || undefined,
      }

      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: 'CARD',
        issueId,
        issueName,
        customer: customerPayload,
      })

      interface IssueResponse {
        code?: string
        message?: string
        billingKey?: string
      }

      const response = issueResponse as IssueResponse
      if (response.code !== undefined) {
        setPayMessage(response.message || '빌링키 발급에 실패했습니다.')
        return
      }

      const billingKey = response.billingKey as string
      const resp = await fetch('/api/pay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingKey, plan, customerId: user.uid }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setPayMessage(data?.error || '구독 결제에 실패했습니다.')
        return
      }
      setPayMessage('구독이 활성화되었습니다.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, '구독 결제')
      setPayMessage(errorMessage)
    } finally {
      setPayLoading(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

  const handleSubscribeKakao = useCallback(async (plan: 'monthly' | 'yearly') => {
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

    const channelKeyKakao = process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    if (!storeId || !channelKeyKakao) {
      setPayMessage('카카오 결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }

    setPayLoadingKakao(plan)
    setPayMessage(null)

    try {
      const PortOne = await import('@portone/browser-sdk/v2')
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `kko-${plan}-${uidShort}-${ts}`.slice(0, 40)
      const issueName = plan === 'monthly' ? '카카오페이 월 구독' : '카카오페이 연간 구독'
      
      interface CustomerPayload {
        fullName: string
        email?: string
        phoneNumber?: string
      }
      
      const customerPayload: CustomerPayload = {
        fullName: fallbackName,
        email: user.email || undefined,
        phoneNumber: phoneNumber || undefined,
      }

      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey: channelKeyKakao,
        billingKeyMethod: 'EASY_PAY',
        issueId,
        issueName,
        customer: customerPayload,
      })

      interface IssueResponse {
        code?: string
        message?: string
        billingKey?: string
      }

      const response = issueResponse as IssueResponse
      if (response.code !== undefined) {
        setPayMessage(response.message || '카카오 빌링키 발급에 실패했습니다.')
        return
      }

      const billingKey = response.billingKey as string
      const resp = await fetch('/api/pay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingKey, plan, customerId: user.uid }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setPayMessage(data?.error || '구독 결제에 실패했습니다.')
        return
      }
      setPayMessage('카카오 구독이 활성화되었습니다.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      const errorMessage = handleError(error, '카카오 구독 결제')
      setPayMessage(errorMessage)
    } finally {
      setPayLoadingKakao(null)
    }
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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
