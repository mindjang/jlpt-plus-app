export type MembershipType = 'monthly' | 'yearly' | 'gift'

export type MembershipSource = 'subscription' | 'code'

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
  billingKey: string
  plan: 'monthly' | 'yearly'
  lastPaymentId?: string
  lastPaidAt?: number
  amount?: number
  provider?: string
}
