'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { signOutUser } from '@/lib/firebase/auth'
import { getUserData, updateUserSettings } from '@/lib/firebase/firestore'

export default function MyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    dailyNewLimit: 10,
    theme: 'auto' as 'light' | 'dark' | 'auto',
  })

  useEffect(() => {
    if (user) {
      loadUserSettings()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user) return

    try {
      const userData = await getUserData(user.uid)
      if (userData?.settings) {
        setSettings({
          dailyNewLimit: userData.settings.dailyNewLimit || 10,
          theme: userData.settings.theme || 'auto',
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDailyNewLimitChange = async (value: number) => {
    if (!user) return

    const newSettings = { ...settings, dailyNewLimit: value }
    setSettings(newSettings)

    try {
      await updateUserSettings(user.uid, { dailyNewLimit: value })
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const handleLogout = async () => {
    await signOutUser()
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="w-full">
        <AppBar title="마이페이지" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full">
        <AppBar title="마이페이지" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <p className="text-body text-text-sub mb-4">로그인이 필요합니다</p>
          <button
            onClick={() => router.push('/home')}
            className="bg-primary text-surface px-6 py-2 rounded-card font-medium button-press"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="마이페이지" />

      <div className="flex flex-col gap-6 p-4">
        {/* 프로필 정보 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <div className="flex items-center gap-4 mb-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-title font-semibold">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-title font-semibold text-text-main">
                {user.displayName || '사용자'}
              </h2>
              <p className="text-body text-text-sub">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 학습 설정 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <h2 className="text-title font-semibold text-text-main mb-4">학습 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="text-body font-medium text-text-main mb-2 block">
                일일 새 카드 수
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={settings.dailyNewLimit}
                  onChange={(e) => handleDailyNewLimitChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-body font-medium text-text-main w-12 text-right">
                  {settings.dailyNewLimit}개
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <h2 className="text-title font-semibold text-text-main mb-4">계정 관리</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/my/settings')}
              className="w-full text-left py-3 px-4 bg-page rounded-card text-body text-text-main button-press"
            >
              설정
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left py-3 px-4 bg-page rounded-card text-body text-red-500 button-press"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 구독/결제 */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-card shadow-soft p-6 text-center">
          <h3 className="text-title font-semibold text-white mb-2">프리미엄 구독</h3>
          <p className="text-body text-white/90 mb-4">
            더 많은 기능과 무제한 학습을 경험하세요
          </p>
          <button className="bg-white text-primary px-6 py-2 rounded-card font-medium button-press">
            구독하기
          </button>
        </div>
      </div>
    </div>
  )
}

