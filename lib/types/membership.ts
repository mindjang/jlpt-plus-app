export type MembershipType = 'monthly' | 'yearly' | 'gift' | 'quarterly' // quarterly: 3개월

export type MembershipSource = 'subscription' | 'code' | 'one-time' // one-time: 단건결제

export interface Membership {
  type: MembershipType
  source: MembershipSource
  expiresAt: number // epoch ms
  createdAt: number // epoch ms
  updatedAt: number // epoch ms
  lastRedeemedCode?: string
}

export interface GiftCode {
  durationDays: number // 코드가 제공하는 기간(일)
  remainingUses?: number | null // null/undefined 이면 무제한
  type?: MembershipType // 지정되지 않으면 'gift'로 처리
  note?: string
  createdAt?: number // epoch ms
}

export interface DailyUsage {
  dateKey: string // YYYY-MM-DD
  sessionsUsed: number
  updatedAt: number // epoch ms
}

export interface BillingInfo {
  billingKey?: string // 단건결제는 billingKey 없음
  plan: 'monthly' | 'quarterly' | 'yearly' // monthly: 1개월, quarterly: 3개월, yearly: 1년
  lastPaymentId?: string
  lastPaidAt?: number
  amount?: number
  provider?: string
  isRecurring?: boolean // true: 정기구독, false: 단건결제
  paymentMethod?: 'CARD' | 'EASY_PAY' // 결제 수단: 카드 또는 간편결제
}
