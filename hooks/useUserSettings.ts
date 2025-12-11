/**
 * 사용자 설정 관리 커스텀 훅
 */
import { useState, useEffect } from 'react'
import { getUserData, updateUserSettings } from '@/lib/firebase/firestore'
import { handleFirestoreError } from '@/lib/utils/errorHandler'
import type { User } from 'firebase/auth'

interface UserSettings {
  dailyNewLimit: number
  theme: 'light' | 'dark' | 'auto'
}

interface UseUserSettingsResult {
  settings: UserSettings
  loading: boolean
  updateDailyNewLimit: (value: number) => Promise<void>
}

/**
 * 사용자 설정을 관리하는 커스텀 훅
 */
export function useUserSettings(user: User | null): UseUserSettingsResult {
  const [settings, setSettings] = useState<UserSettings>({
    dailyNewLimit: 20,
    theme: 'auto',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      const userData = await getUserData(user.uid)
      if (userData?.settings) {
        setSettings({
          dailyNewLimit: userData.settings.dailyNewLimit || 20,
          theme: userData.settings.theme || 'auto',
        })
      }
    } catch (error) {
      handleFirestoreError(error, '사용자 설정 로드')
    } finally {
      setLoading(false)
    }
  }

  const updateDailyNewLimit = async (value: number) => {
    if (!user) return

    const newSettings = { ...settings, dailyNewLimit: value }
    setSettings(newSettings)

    try {
      await updateUserSettings(user.uid, { dailyNewLimit: value })
    } catch (error) {
      handleFirestoreError(error, '설정 업데이트')
    }
  }

  return {
    settings,
    loading,
    updateDailyNewLimit,
  }
}
