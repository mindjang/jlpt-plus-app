'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { signOutUser } from '@/lib/firebase/auth'
import { getUserData, updateUserSettings, updateUserProfile } from '@/lib/firebase/firestore'
import { useMembership } from '@/components/membership/MembershipProvider'

export default function MyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { status: membershipStatus, membership, redeemCode, refresh } = useMembership()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    dailyNewLimit: 10,
    theme: 'auto' as 'light' | 'dark' | 'auto',
  })
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined)
  const [displayName, setDisplayName] = useState<string | undefined>(undefined)
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null)
  const [redeemCodeInput, setRedeemCodeInput] = useState('')
  const [payLoading, setPayLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [countryCode, setCountryCode] = useState('82') // 기본 한국
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | null>(null)

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
      if (userData?.profile?.phoneNumber) {
        setPhoneNumber(userData.profile.phoneNumber)
      } else if (user.phoneNumber) {
        setPhoneNumber(user.phoneNumber)
      }
      if (userData?.profile?.displayName) {
        setDisplayName(userData.profile.displayName)
        setNameInput(userData.profile.displayName)
      } else if (user.displayName) {
        setDisplayName(user.displayName)
        setNameInput(user.displayName)
      } else if (user.email) {
        const prefix = user.email.split('@')[0]
        setDisplayName(prefix)
        setNameInput(prefix)
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

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('0') && countryCode === '82') {
      // 한국 로컬번호 010xxxx → +8210xxxx
      return `+82${digits.slice(1)}`
    }
    if (digits.startsWith(countryCode)) {
      return `+${digits}`
    }
    if (raw.startsWith('+')) {
      return raw
    }
    return `+${countryCode}${digits}`
  }

  const savePhoneAndContinue = async () => {
    if (!user) {
      setPhoneError('로그인이 필요합니다.')
      return
    }
    const normalized = normalizePhone(phoneInput)
    if (!normalized) {
      setPhoneError('전화번호를 입력해주세요. 예: 01012345678')
      return
    }
    if (!nameInput.trim()) {
      setPhoneError('이름을 입력해주세요.')
      return
    }
    setPhoneLoading(true)
    setPhoneError(null)
    try {
      await updateUserProfile(user.uid, { phoneNumber: normalized, displayName: nameInput.trim() })
      setPhoneNumber(normalized)
      setDisplayName(nameInput.trim())
      setShowPhoneModal(false)
      setPhoneInput('')
      setNameInput(nameInput.trim())
      const plan = pendingPlan
      setPendingPlan(null)
      if (plan) {
        await handleSubscribe(plan)
      }
    } catch (error: any) {
      console.error('[Phone] save error', error)
      setPhoneError(error?.message || '전화번호 저장에 실패했습니다.')
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) return
    if (!user.email) {
      setPayMessage('이메일 정보가 필요합니다. 계정에 이메일이 있는지 확인해주세요.')
      return
    }
    const fallbackName =
      (displayName || nameInput || user.displayName || (user.email ? user.email.split('@')[0] : '') || '사용자').trim() ||
      '사용자'

    if (!phoneNumber || !fallbackName) {
      setPendingPlan(plan)
      setShowPhoneModal(true)
      setPhoneError(null)
      return
    }
    setPayLoading(plan)
    setPayMessage(null)
    try {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
      if (!storeId || !channelKey) {
        setPayMessage('결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
        return
      }

      const PortOne = await import('@portone/browser-sdk/v2')
      // issueId는 ASCII, 최대 40자 제한 (이니시스 V2)
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `bill-${plan}-${uidShort}-${ts}`.slice(0, 40)
      const issueName = plan === 'monthly' ? '월간 구독 빌링키 발급' : '연간 구독 빌링키 발급'
      const customerPayload: any = {
        fullName: fallbackName,
        name: fallbackName,
        email: user.email || undefined,
        phoneNumber: phoneNumber || undefined,
      }
      console.log('[Pay] requestIssueBillingKey payload', { storeId, channelKey, customerPayload })
      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: 'CARD',
        issueId,
        issueName,
        customer: customerPayload,
        // noticeUrls: ['https://your-webhook.example.com/portone'], // 필요 시 웹훅 URL 지정
      })

      if ((issueResponse as any).code !== undefined) {
        setPayMessage((issueResponse as any).message || '빌링키 발급에 실패했습니다.')
        return
      }

      const billingKey = (issueResponse as any).billingKey as string
      const resp = await fetch('/api/pay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingKey, plan, customerId: user.uid }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setPayMessage(data?.error || '구독 결제에 실패했습니다.')
        return
      }
      setPayMessage('구독이 활성화되었습니다.')
      await refresh()
    } catch (error: any) {
      console.error('[MyPage] subscribe error', error)
      setPayMessage(error?.message || '알 수 없는 오류가 발생했습니다.')
    } finally {
      setPayLoading(null)
    }
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
    <div className="w-full overflow-hidden relative">
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

        {/* 멤버십 상태 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <h2 className="text-title font-semibold text-text-main mb-2">멤버십</h2>
          <p className="text-body text-text-sub mb-3">
            {membershipStatus === 'member'
              ? `만료: ${new Date(membership?.expiresAt || 0).toLocaleDateString()}`
              : membershipStatus === 'expired'
                ? '만료된 회원권입니다. 갱신이 필요해요.'
                : '무료 이용 중입니다.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="w-full py-3 rounded-card bg-primary text-surface text-body font-semibold button-press disabled:opacity-50"
              disabled={payLoading === 'monthly'}
              onClick={() => handleSubscribe('monthly')}
            >
              {payLoading === 'monthly' ? '결제중...' : '월 구독'}
            </button>
            <button
              className="w-full py-3 rounded-card bg-blue-500 text-surface text-body font-semibold button-press disabled:opacity-50"
              disabled={payLoading === 'yearly'}
              onClick={() => handleSubscribe('yearly')}
            >
              {payLoading === 'yearly' ? '결제중...' : '연 구독'}
            </button>
          </div>
          {payMessage && <div className="text-label text-primary mt-2">{payMessage}</div>}
          <div className="mt-4 space-y-2">
            <label className="text-label text-text-sub">8자리 코드 등록</label>
            <div className="flex gap-2">
              <input
                value={redeemCodeInput}
                onChange={(e) => setRedeemCodeInput(e.target.value)}
                maxLength={16}
                placeholder="예: ABCD-1234"
                className="flex-1 border border-divider rounded-card px-3 py-2 text-body"
              />
              <button
                className="px-4 py-2 bg-page border border-divider rounded-card text-body font-medium button-press"
                onClick={async () => {
                  try {
                    setRedeemMessage(null)
                    await redeemCode(redeemCodeInput.trim())
                    setRedeemCodeInput('')
                    setRedeemMessage('코드가 적용되었어요!')
                    await refresh()
                  } catch (error: any) {
                    setRedeemMessage(error?.message || '코드 적용에 실패했습니다.')
                  }
                }}
              >
                등록
              </button>
            </div>
            {redeemMessage && <div className="text-label text-primary">{redeemMessage}</div>}
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

      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 relative">
            <button
              onClick={() => {
                setShowPhoneModal(false)
                setPhoneError(null)
                setPendingPlan(null)
              }}
              className="absolute right-3 top-3 text-text-sub hover:text-text-main"
              aria-label="닫기"
            >
              ✕
            </button>
            <h2 className="text-title font-semibold text-text-main">결제 정보 등록</h2>
            <p className="text-body text-text-sub">
              정기 결제를 위해 이름과 휴대폰 번호를 등록해주세요. (인증 없음)
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-label text-text-sub mb-1 block">이름</label>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full border border-divider rounded-card px-3 py-2"
                />
              </div>
              <div>
                <label className="text-label text-text-sub mb-1 block">휴대폰 번호</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="border border-divider rounded-card px-2 py-2 bg-page"
                  >
                    <option value="82">+82 KR</option>
                    <option value="81">+81 JP</option>
                    <option value="1">+1 US</option>
                  </select>
                  <input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="01012345678"
                    className="flex-1 border border-divider rounded-card px-3 py-2"
                  />
                </div>
              </div>
              {phoneError && <div className="text-label text-red-500">{phoneError}</div>}
              <div className="flex gap-2">
                <button
                  onClick={savePhoneAndContinue}
                  disabled={phoneLoading}
                  className="flex-1 py-3 rounded-card bg-primary text-surface font-semibold button-press disabled:opacity-60"
                >
                  {phoneLoading ? '저장 중...' : '정보 등록하고 구독'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

