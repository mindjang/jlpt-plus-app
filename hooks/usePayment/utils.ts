/**
 * 결제 관련 공통 유틸리티 함수
 */
import type { User } from 'firebase/auth'
import type { PaymentPlan, CustomerPayload, UserInfo } from './types'

export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
}

export function validateUserAndGetInfo(
  user: User | null,
  phoneNumber: string | undefined,
  displayName: string | undefined,
  nameInput: string,
  plan: PaymentPlan,
  setPayMessage: (message: string | null) => void,
  setPendingPlan: (plan: PaymentPlan | null) => void,
  onPhoneRequired?: (plan: PaymentPlan) => void
): UserInfo | null {
  if (!user) return null
  if (!user.email) {
    setPayMessage('이메일 정보가 필요합니다. 계정에 이메일이 있는지 확인해주세요.')
    return null
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
    return null
  }

  if (!fallbackName) {
    setPayMessage('이름 정보가 필요합니다.')
    return null
  }

  return { isValid: true, fallbackName, mobile }
}

export function createCustomerPayload(
  user: User | null,
  phoneNumber: string | undefined,
  fallbackName: string,
  billingKeyMethod: 'CARD' | 'EASY_PAY'
): CustomerPayload {
  const customerPayload: CustomerPayload = {
    fullName: fallbackName,
  }

  if (user?.email) {
    customerPayload.email = user.email
  }
  if (phoneNumber) {
    customerPayload.phoneNumber = phoneNumber
  }

  if (billingKeyMethod === 'CARD') {
    customerPayload.name = fallbackName
  }

  return customerPayload
}

