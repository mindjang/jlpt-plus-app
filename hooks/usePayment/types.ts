/**
 * 결제 관련 타입 정의
 */
import type { User } from 'firebase/auth'

export type SubscriptionPlan = 'monthly' | 'quarterly'
export type OneTimePlan = 'monthly' | 'yearly'
export type PaymentPlan = SubscriptionPlan | OneTimePlan

export interface UsePaymentOptions {
  user: User | null
  phoneNumber: string | undefined
  displayName: string | undefined
  nameInput: string
  onRefresh?: () => void | Promise<void>
  onPhoneRequired?: (plan: PaymentPlan) => void
}

export interface UsePaymentResult {
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

export interface BillingKeyConfig {
  storeId: string
  channelKey: string
  billingKeyMethod: 'CARD' | 'EASY_PAY'
  issueIdPrefix: string
  issueName: string
  errorMessage: string
  successMessage: string
}

export interface CustomerPayload {
  fullName: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
}

export interface UserInfo {
  isValid: boolean
  fallbackName: string
  mobile: boolean
}

