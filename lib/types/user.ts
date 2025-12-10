// 유저 관련 타입 정의
import type { JlptLevel } from './content'

export interface UserProfile {
  displayName?: string
  createdAt: number // epoch ms
  targetLevel?: JlptLevel
  email?: string
  photoURL?: string
  phoneNumber?: string
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

