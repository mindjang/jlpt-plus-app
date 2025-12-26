/**
 * 결제 로직 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import type {
  UsePaymentOptions,
  UsePaymentResult,
  SubscriptionPlan,
  OneTimePlan,
  BillingKeyConfig,
} from './usePayment/types'
import { processSubscription } from './usePayment/subscription'
import { processOneTimePayment } from './usePayment/oneTime'

// 타입 re-export
export type {
  UsePaymentOptions,
  UsePaymentResult,
  SubscriptionPlan,
  OneTimePlan,
  PaymentPlan,
  BillingKeyConfig,
  CustomerPayload,
} from './usePayment/types'

export function usePayment({
  user,
  phoneNumber,
  displayName,
  nameInput,
  onRefresh,
  onPhoneRequired,
}: UsePaymentOptions): UsePaymentResult {
  const [payLoading, setPayLoading] = useState<UsePaymentResult['payLoading']>(null)
  const [payLoadingKakao, setPayLoadingKakao] = useState<UsePaymentResult['payLoadingKakao']>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<UsePaymentResult['pendingPlan']>(null)

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

    await processSubscription({
      plan,
      config,
      user,
      phoneNumber,
      displayName,
      nameInput,
      setLoading: setPayLoading,
      setPayMessage,
      setPendingPlan,
      onRefresh,
      onPhoneRequired,
    })
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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

    await processSubscription({
      plan,
      config,
      user,
      phoneNumber,
      displayName,
      nameInput,
      setLoading: setPayLoadingKakao,
      setPayMessage,
      setPendingPlan,
      onRefresh,
      onPhoneRequired,
    })
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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

    await processOneTimePayment({
      plan,
      config,
      user,
      phoneNumber,
      displayName,
      nameInput,
      setLoading: setPayLoading,
      setPayMessage,
      setPendingPlan,
      onRefresh,
      onPhoneRequired,
    })
  }, [user, phoneNumber, displayName, nameInput, onRefresh, onPhoneRequired])

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

    await processOneTimePayment({
      plan,
      config,
      user,
      phoneNumber,
      displayName,
      nameInput,
      setLoading: setPayLoadingKakao,
      setPayMessage,
      setPendingPlan,
      onRefresh,
      onPhoneRequired,
    })
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
    handleOneTimePayment,
    handleOneTimePaymentKakao,
  }
}
