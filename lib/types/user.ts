// 유저 관련 타입 정의
import type { JlptLevel } from './content'

export interface UserProfile {
  uid?: string // Added for easier identification in lists
  displayName?: string
  createdAt: number // epoch ms
  targetLevel?: JlptLevel
  email?: string
  photoURL?: string
  phoneNumber?: string
  birthDate?: string // 생년월일 (YYYY-MM-DD 형식)
}

export interface UserSettings {
  dailyNewLimit: number // 기본 10개
  theme?: 'light' | 'dark' | 'auto'
  notifications?: boolean
  soundEnabled?: boolean
}

export interface UserData {
  profile: UserProfile
  settings: UserSettings
}

