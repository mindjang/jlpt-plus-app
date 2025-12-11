'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUserSettings } from '@/hooks/useUserSettings'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'

export default function MySettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { settings, loading, updateDailyNewLimit } = useUserSettings(user)
  const [value, setValue] = useState<number>(settings.dailyNewLimit)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setValue(settings.dailyNewLimit)
  }, [settings.dailyNewLimit])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      setMessage(null)
      await updateDailyNewLimit(value)
      setMessage('일일 목표가 저장되었습니다.')
    } catch (error: any) {
      setMessage(error?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="w-full">
        <AppBar title="일일 목표 설정" />
        <div className="flex items-center justify-center min-h-[50vh] text-text-sub">불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-page">
      <AppBar title="일일 목표 설정" />
      <div className="p-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div>
            <div className="text-title font-semibold text-text-main">일일 목표 학습량</div>
            <div className="text-body text-text-sub mt-1">자동 학습에서 새 카드/복습 카드 목표를 결정합니다.</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {AUTO_STUDY_TARGET_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setValue(opt)}
                className={`px-4 py-2 rounded-xl border text-body font-medium transition-colors ${
                  value === opt ? 'bg-black text-white border-black' : 'bg-white border-divider text-text-main hover:border-text-sub'
                }`}
              >
                {opt}개
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-xl bg-white border border-divider text-text-main font-semibold"
            >
              돌아가기
            </button>
          </div>
          {message && <div className="text-sm text-primary">{message}</div>}
        </div>
      </div>
    </div>
  )
}

