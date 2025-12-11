'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { signOutUser } from '@/lib/firebase/auth'
import { getUserData, updateUserSettings, updateUserProfile } from '@/lib/firebase/firestore'
import { useMembership } from '@/components/membership/MembershipProvider'
import { PaywallOverlay } from '@/components/membership/PaywallOverlay'
import { FullScreenModal } from '@/components/ui/FullScreenModal'

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
  const [payLoadingKakao, setPayLoadingKakao] = useState<'monthly' | 'yearly' | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [countryCode, setCountryCode] = useState('82') // 기본 한국
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

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

  const handleSubscribeKakao = async (plan: 'monthly' | 'yearly') => {
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
    const channelKeyKakao = process.env.NEXT_PUBLIC_PORTONE_KAKAO_CHANNEL_KEY
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
    if (!storeId || !channelKeyKakao) {
      setPayMessage('카카오 결제 설정이 준비되지 않았습니다. (storeId/channelKey)')
      return
    }
    setPayLoadingKakao(plan)
    setPayMessage(null)
    try {
      const PortOne = await import('@portone/browser-sdk/v2')
      const uidShort = user.uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'user'
      const ts = Date.now().toString(36)
      const issueId = `kko-${plan}-${uidShort}-${ts}`.slice(0, 40)
      const issueName = plan === 'monthly' ? '카카오페이 월 구독' : '카카오페이 연간 구독'
      const customerPayload: any = {
        fullName: fallbackName,
        email: user.email || undefined,
        phoneNumber: phoneNumber || undefined,
      }
      console.log('[Pay-Kakao] requestIssueBillingKey payload', { storeId, channelKeyKakao, customerPayload })
      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey: channelKeyKakao,
        billingKeyMethod: 'EASY_PAY',
        issueId,
        issueName,
        customer: customerPayload,
      })
      if ((issueResponse as any).code !== undefined) {
        setPayMessage((issueResponse as any).message || '카카오 빌링키 발급에 실패했습니다.')
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
      setPayMessage('카카오 구독이 활성화되었습니다.')
      await refresh()
    } catch (error: any) {
      console.error('[MyPage] kakao subscribe error', error)
      setPayMessage(error?.message || '알 수 없는 오류가 발생했습니다.')
    } finally {
      setPayLoadingKakao(null)
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
      <div className="w-full overflow-hidden relative min-h-[70vh]">
        <AppBar title="마이페이지" />
        <div className="p-4">
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-divider rounded-2xl p-6 space-y-3 shadow-soft">
            <h2 className="text-title font-semibold text-text-main">마이페이지는 로그인 후 이용 가능해요</h2>
            <p className="text-body text-text-sub">
              통계처럼 로그인 후 학습 기록, 멤버십 상태를 확인하세요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/home')}
                className="flex-1 py-3 rounded-card bg-primary text-surface text-body font-semibold button-press"
              >
                로그인하기
              </button>
              <button
                onClick={() => router.push('/acquire')}
                className="py-3 px-4 rounded-card bg-page border border-divider text-body text-text-main font-medium button-press"
              >
                둘러보기
              </button>
            </div>
          </div>
        </div>

        <PaywallOverlay
          title="로그인이 필요해요"
          description="학습 진행 상황과 멤버십을 보려면 로그인해 주세요."
          showRedeem={false}
          showPlans={false}
          showLogin
        />
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
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              className="w-full py-3 rounded-card bg-yellow-400 text-black text-body font-semibold button-press disabled:opacity-50"
              disabled={payLoadingKakao === 'monthly'}
              onClick={() => handleSubscribeKakao('monthly')}
            >
              {payLoadingKakao === 'monthly' ? '결제중...' : '월 결제(카카오)'}
            </button>
            <button
              className="w-full py-3 rounded-card bg-yellow-500 text-black text-body font-semibold button-press disabled:opacity-50"
              disabled={payLoadingKakao === 'yearly'}
              onClick={() => handleSubscribeKakao('yearly')}
            >
              {payLoadingKakao === 'yearly' ? '결제중...' : '년 결제(카카오)'}
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

        {/* 회사 정보 및 약관 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-label text-text-sub">
              <div>상호명: 재미찾는개발자</div>
              <div>사업자번호: 547-12-02515</div>
            </div>
            <div className="flex gap-4 text-label">
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:underline button-press"
              >
                이용약관
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-primary hover:underline button-press"
              >
                개인정보취급방침
              </button>
            </div>
          </div>
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

      {/* 이용약관 모달 */}
      <FullScreenModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="이용약관"
      >
        <div className="max-w-2xl mx-auto space-y-6 text-body text-text-main">
          <div className="space-y-4">
            <section>
              <h3 className="text-title font-semibold mb-3">제1조 (목적)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                본 약관은 재미찾는개발자(이하 "회사")가 제공하는 JLPT Plus 언어 학습 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제2조 (정의)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. "서비스"란 회사가 제공하는 일본어 학습 애플리케이션 및 관련 웹 서비스를 의미합니다.</p>
                <p>2. "이용자"란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 의미합니다.</p>
                <p>3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</p>
                <p>4. "콘텐츠"란 서비스를 통해 제공되는 단어, 한자, 예문, 학습 자료 등을 의미합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제3조 (약관의 게시와 개정)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>일본어 단어 및 한자 학습 서비스</li>
                  <li>학습 진도 관리 및 통계 서비스</li>
                  <li>반복 학습 시스템(SRS) 기반 학습 서비스</li>
                  <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스</li>
                </ul>
                <p>2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제5조 (서비스의 중단)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
                <p>2. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제6조 (회원가입)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
                <p>2. 회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제7조 (회원 정보의 변경)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한 실명, 아이디 등은 수정이 불가능합니다.
              </p>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제8조 (개인정보보호)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 회사의 개인정보보호에 관한 자세한 사항은 개인정보취급방침을 참고하시기 바랍니다.
              </p>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제9조 (회원의 의무)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회원은 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>신청 또는 변경시 허위내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제10조 (유료서비스의 이용)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 유료서비스의 구체적인 내용을 서비스 화면에 게시합니다.</p>
                <p>2. 회사는 이용자가 구매한 유료서비스에 대하여 청약철회의 제한에 따르는 경우를 제외하고는 원칙적으로 구매일로부터 7일 이내에 청약철회를 할 수 있도록 합니다.</p>
                <p>3. 회사는 다음 각 호에 해당하는 경우에는 이용자의 청약철회를 제한할 수 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>이용자에게 책임이 있는 사유로 재화 등이 멸실되거나 훼손된 경우</li>
                  <li>이용자의 사용 또는 일부 소비로 재화 등의 가치가 현저히 감소한 경우</li>
                  <li>시간의 경과에 의하여 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제11조 (면책조항)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p>2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
                <p>3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제12조 (준거법 및 관할법원)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                본 약관은 대한민국 법률에 따라 규율되고 해석됩니다. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
              </p>
            </section>

            <div className="pt-4 border-t border-divider">
              <p className="text-label text-text-sub">
                본 약관은 2024년 1월 1일부터 시행됩니다.
              </p>
            </div>
          </div>
        </div>
      </FullScreenModal>

      {/* 개인정보취급방침 모달 */}
      <FullScreenModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="개인정보취급방침"
      >
        <div className="max-w-2xl mx-auto space-y-6 text-body text-text-main">
          <div className="space-y-4">
            <section>
              <h3 className="text-title font-semibold mb-3">제1조 (개인정보의 처리목적)</h3>
              <p className="text-body text-text-sub leading-relaxed mb-2">
                재미찾는개발자(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회원 가입 및 관리</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.</li>
                </ul>
                <p>2. 재화 또는 서비스 제공</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>서비스 제공, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 요금결제·정산을 목적으로 개인정보를 처리합니다.</li>
                </ul>
                <p>3. 마케팅 및 광고에의 활용</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공 등을 목적으로 개인정보를 처리합니다.</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>회원 가입 및 관리: 회원 탈퇴시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지)</li>
                  <li>재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료시까지 (단, 전자상거래법 등 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관)</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제3조 (처리하는 개인정보의 항목)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                <p>1. 회원 가입 및 관리</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>필수항목: 이메일, 비밀번호, 닉네임</li>
                  <li>선택항목: 전화번호, 프로필 사진</li>
                </ul>
                <p>2. 재화 또는 서비스 제공</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>필수항목: 이메일, 이름, 전화번호, 결제정보</li>
                  <li>자동 수집 항목: IP주소, 쿠키, MAC주소, 서비스 이용 기록, 접속 로그, 기기정보</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
                <p>2. 회사는 원활한 서비스 제공을 위해 다음과 같이 제3자에게 개인정보를 제공할 수 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>결제 서비스 제공: 포트원(PortOne) - 결제 처리 및 빌링키 발급을 위해 필요한 최소한의 정보 제공</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제5조 (개인정보처리의 위탁)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>클라우드 서비스 제공: Google Firebase (데이터 저장 및 인증 서비스)</li>
                  <li>결제 서비스 제공: 포트원(PortOne) (결제 처리 서비스)</li>
                </ul>
                <p>2. 회사는 위탁계약 체결시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제6조 (정보주체의 권리·의무 및 그 행사방법)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>개인정보 처리정지 요구권</li>
                  <li>개인정보 열람요구권</li>
                  <li>개인정보 정정·삭제요구권</li>
                  <li>개인정보 처리정지 요구권</li>
                </ul>
                <p>2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
                <p>3. 정보주체가 개인정보의 오류에 대한 정정을 요청한 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제7조 (개인정보의 파기)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                <p>2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제8조 (개인정보 보호책임자)</h3>
              <div className="text-body text-text-sub leading-relaxed space-y-2">
                <p>1. 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>상호명: 재미찾는개발자</li>
                  <li>사업자번호: 547-12-02515</li>
                  <li>이메일: support@jlptplus.app (문의 시 사용)</li>
                </ul>
                <p>2. 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제9조 (개인정보의 안전성 확보조치)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다: 관리적 조치(내부관리계획 수립·시행, 정기적 직원 교육 등), 기술적 조치(개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치), 물리적 조치(전산실, 자료보관실 등의 접근통제).
              </p>
            </section>

            <section>
              <h3 className="text-title font-semibold mb-3">제10조 (개인정보 처리방침 변경)</h3>
              <p className="text-body text-text-sub leading-relaxed">
                이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <div className="pt-4 border-t border-divider">
              <p className="text-label text-text-sub">
                본 개인정보취급방침은 2024년 1월 1일부터 시행됩니다.
              </p>
            </div>
          </div>
        </div>
      </FullScreenModal>

    </div>
  )
}

