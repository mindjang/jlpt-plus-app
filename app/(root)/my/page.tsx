'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { signOutUser } from '@/lib/firebase/auth'
import { getUserData } from '@/lib/firebase/firestore'
import { useMembership } from '@/components/membership/MembershipProvider'
import { PaywallOverlay } from '@/components/membership/PaywallOverlay'
import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { handleError } from '@/lib/utils/errorHandler'
import { useUserSettings } from '@/hooks/useUserSettings'
import { usePhoneModal } from '@/hooks/usePhoneModal'
import { usePayment } from '@/hooks/usePayment'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { TermsContent } from '@/data/legal/terms'
import { PrivacyContent } from '@/data/legal/privacy'

export default function MyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { status: membershipStatus, membership, redeemCode, refresh } = useMembership()
  const { settings, loading: settingsLoading, updateDailyNewLimit } = useUserSettings(user)
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(undefined)
  const [displayName, setDisplayName] = useState<string | undefined>(undefined)
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null)
  const [redeemCodeInput, setRedeemCodeInput] = useState('')
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null)

  // 전화번호 모달 관리
  const phoneModal = usePhoneModal({
    user,
    onSuccess: async (normalizedPhone, normalizedName) => {
      setPhoneNumber(normalizedPhone)
      setDisplayName(normalizedName)
      setNameInput(normalizedName)
      const plan = payment.pendingPlan
      payment.setPendingPlan(null)
      if (plan) {
        await payment.handleSubscribe(plan)
      }
    },
  })

  // 결제 관리
  const payment = usePayment({
    user,
    phoneNumber,
    displayName,
    nameInput: phoneModal.nameInput,
    onRefresh: refresh,
    onPhoneRequired: (plan) => {
      payment.setPendingPlan(plan)
      phoneModal.setShowPhoneModal(true)
      phoneModal.setPhoneError(null)
    },
  })

  // 프로필 정보 로드
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const userData = await getUserData(user.uid)
      if (userData?.profile?.phoneNumber) {
        setPhoneNumber(userData.profile.phoneNumber)
      } else if (user.phoneNumber) {
        setPhoneNumber(user.phoneNumber)
      }
      if (userData?.profile?.displayName) {
        setDisplayName(userData.profile.displayName)
        setNameInput(userData.profile.displayName)
        phoneModal.setNameInput(userData.profile.displayName)
      } else if (user.displayName) {
        setDisplayName(user.displayName)
        setNameInput(user.displayName)
        phoneModal.setNameInput(user.displayName)
      } else if (user.email) {
        const prefix = user.email.split('@')[0]
        setDisplayName(prefix)
        setNameInput(prefix)
        phoneModal.setNameInput(prefix)
      }
    } catch (error) {
      handleError(error, '프로필 로드')
    }
  }

  const handleLogout = async () => {
    await signOutUser()
    router.push('/home')
  }

  const handleRedeemCode = async () => {
    if (!redeemCodeInput.trim()) {
      setRedeemMessage('코드를 입력해주세요.')
      return
    }

    try {
      setRedeemLoading(true)
      setRedeemMessage(null)
      await redeemCode(redeemCodeInput.trim())
      setRedeemCodeInput('')
      setRedeemMessage('코드가 적용되었어요!')
      setShowRedeemConfirm(false)
      await refresh()
    } catch (error) {
      const errorMessage = handleError(error, '코드 등록')
      setRedeemMessage(errorMessage)
      setShowRedeemConfirm(false)
    } finally {
      setRedeemLoading(false)
    }
  }


  const loading = settingsLoading

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
        <div className="p-5 pb-24">
          <div className="bg-surface border border-divider rounded-2xl p-8 space-y-4 shadow-lg">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-text-main">마이페이지는 로그인 후 이용 가능해요</h2>
              <p className="text-body text-text-sub leading-relaxed">
              통계처럼 로그인 후 학습 기록, 멤버십 상태를 확인하세요.
            </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push('/home')}
                className="flex-1 py-3.5 rounded-xl bg-primary text-surface text-body font-semibold hover:opacity-90 transition-opacity button-press"
              >
                로그인하기
              </button>
              <button
                onClick={() => router.push('/acquire')}
                className="py-3.5 px-6 rounded-xl bg-surface border border-divider text-body text-text-main font-medium hover:bg-page transition-colors button-press"
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

  const getMembershipBadgeColor = () => {
    if (membershipStatus === 'member') return 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600'
    if (membershipStatus === 'expired') return 'bg-gray-500'
    return 'bg-blue-500'
  }

  const getMembershipBadgeText = () => {
    if (membershipStatus === 'member') return '프리미엄 회원'
    if (membershipStatus === 'expired') return '만료됨'
    return '무료 이용'
  }

  return (
    <div className="w-full overflow-hidden relative pb-24">
      <AppBar title="마이페이지" />

      <div className="flex flex-col gap-5 p-5">
        {/* 프로필 정보 - Header Card */}
        <div className="bg-surface rounded-lg p-6 border border-divider/50">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <div className="relative">
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                  className="w-20 h-20 rounded-lg object-cover shadow-md border-2 border-divider"
              />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-divider">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-main truncate">
                {user.displayName || '사용자'}
              </h2>
              <p className="text-sm text-text-sub truncate mt-0.5">{user.email}</p>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${getMembershipBadgeColor()}`}>
                {getMembershipBadgeText()}
              </div>
            </div>
          </div>
        </div>

        {/* 멤버십 상태 - Premium Card */}
        <div className="bg-surface rounded-lg p-6 border border-divider/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">멤버십</h2>
            {membershipStatus === 'member' && membership?.expiresAt && (
              <span className="text-xs font-medium bg-page px-3 py-1 rounded-full">
                만료일: {new Date(membership.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="mb-5">
            <p className={`text-sm font-medium ${
              membershipStatus === 'member' 
                ? 'text-primary' 
                : membershipStatus === 'expired'
                  ? 'text-red-500'
                  : 'text-text-sub'
            }`}>
            {membershipStatus === 'member'
                ? `프리미엄 회원으로 이용 중입니다`
              : membershipStatus === 'expired'
                ? '만료된 회원권입니다. 갱신이 필요해요.'
                : '무료 이용 중입니다.'}
          </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="w-full py-3.5 rounded-lg bg-primary text-surface text-sm font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={payment.payLoading === 'monthly' || payment.payLoadingKakao === 'monthly'}
              onClick={() => {
                setSelectedPlan('monthly')
                setShowPaymentMethodModal(true)
              }}
            >
              {(payment.payLoading === 'monthly' || payment.payLoadingKakao === 'monthly') ? '결제중...' : '월 구독'}
            </button>
            <button
              className="w-full py-3.5 rounded-lg bg-blue-500 text-surface text-sm font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={payment.payLoading === 'yearly' || payment.payLoadingKakao === 'yearly'}
              onClick={() => {
                setSelectedPlan('yearly')
                setShowPaymentMethodModal(true)
              }}
            >
              {(payment.payLoading === 'yearly' || payment.payLoadingKakao === 'yearly') ? '결제중...' : '연 구독'}
            </button>
          </div>

          {payment.payMessage && (
            <div className="mt-4 p-3 rounded-lg bg-page border border-divider">
              <p className="text-xs text-primary font-medium">{payment.payMessage}</p>
          </div>
          )}

          <div className="mt-6 pt-6 border-t border-divider">
            <label className="text-sm font-semibold text-text-main mb-3 block">쿠폰 코드 등록</label>
            <div className="flex gap-2">
              <input
                value={redeemCodeInput}
                onChange={(e) => setRedeemCodeInput(e.target.value)}
                maxLength={16}
                placeholder="예: ABCD-1234"
                className="flex-1 border border-divider rounded-lg px-4 py-3 text-body bg-page focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                className="px-5 py-3 bg-primary text-surface rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity button-press whitespace-nowrap"
                onClick={() => {
                  if (!redeemCodeInput.trim()) {
                    setRedeemMessage('코드를 입력해주세요.')
                    return
                  }
                  setShowRedeemConfirm(true)
                }}
              >
                등록
              </button>
            </div>
            {redeemMessage && (
              <div className={`mt-2 text-xs font-medium ${
                redeemMessage.includes('적용') ? 'text-green-600' : 'text-primary'
              }`}>
                {redeemMessage}
              </div>
            )}
          </div>
        </div>

        {/* 학습 설정 */}
        <div className="bg-surface rounded-lg p-6 border border-divider/50">
          <h2 className="text-lg font-bold text-text-main mb-5">학습 설정</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-sub">학습 목표량</span>
              <span className="text-base font-bold text-text-main">
                {settings.dailyNewLimit}개
              </span>
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="">
          <h2 className="font-bold text-sm text-text-main mb-2 pl-1.5">계정 관리</h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/stats')}
              className="w-full text-left py-3.5 px-4 bg-white hover:bg-divider/30 rounded-lg text-body text-text-main font-medium transition-colors button-press flex items-center justify-between group"
            >
              <span>독서 기록</span>
              <span className="text-text-sub group-hover:text-text-main transition-colors">→</span>
            </button>
            <button
              onClick={() => router.push('/my/settings')}
              className="w-full text-left py-3.5 px-4 bg-white hover:bg-divider/30 rounded-lg text-body text-text-main font-medium transition-colors button-press flex items-center justify-between group"
            >
              <span>설정</span>
              <span className="text-text-sub group-hover:text-text-main transition-colors">→</span>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
                className="w-full text-left py-3.5 px-4 bg-white hover:bg-red-50 rounded-lg text-body text-red-500 font-medium transition-colors button-press flex items-center justify-between group"
            >
                <span>로그아웃</span>
                <span className="text-red-400 group-hover:text-red-500 transition-colors">→</span>
            </button>
          </div>
        </div>

        {/* 구독/결제 - Premium Banner */}
        <div className="bg-primary rounded-lg p-8 text-center border border-divider/50">
          <h3 className="text-xl font-bold text-white mb-2">프리미엄 구독</h3>
          <p className="text-sm text-white/90 mb-6 leading-relaxed">
            더 많은 기능과 무제한 학습을 경험하세요
          </p>
          <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity button-press">
            구독하기
          </button>
        </div>

        {/* 회사 정보 및 약관 - Minimal Footer */}
        <div className="bg-surface/50 rounded-lg p-5 border border-divider/30">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-xs text-text-sub space-y-1">
              <div>상호명: 재미찾는개발자</div>
              <div>사업자번호: 547-12-02515</div>
            </div>
            <div className="flex gap-6 text-xs pt-1">
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:text-primary/80 font-medium transition-colors button-press"
              >
                이용약관
              </button>
              <span className="text-divider">|</span>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-primary hover:text-primary/80 font-medium transition-colors button-press"
              >
                개인정보취급방침
              </button>
            </div>
          </div>
        </div>
      </div>

      {phoneModal.showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-lg shadow-xl p-6 space-y-5 relative border border-divider/50">
            <button
              onClick={() => {
                phoneModal.setShowPhoneModal(false)
                phoneModal.setPhoneError(null)
                payment.setPendingPlan(null)
              }}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-page rounded-full transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
            <div className="pr-8">
              <h2 className="text-xl font-bold text-text-main mb-2">결제 정보 등록</h2>
              <p className="text-sm text-text-sub leading-relaxed">
              정기 결제를 위해 이름과 휴대폰 번호를 등록해주세요. (인증 없음)
            </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-text-main mb-2 block">이름</label>
                <input
                  value={phoneModal.nameInput}
                  onChange={(e) => phoneModal.setNameInput(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full border border-divider rounded-lg px-4 py-3 text-body bg-page focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-main mb-2 block">휴대폰 번호</label>
                <div className="flex gap-2">
                  <select
                    value={phoneModal.countryCode}
                    onChange={(e) => phoneModal.setCountryCode(e.target.value)}
                    className="border border-divider rounded-lg px-3 py-3 bg-page text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="82">+82 KR</option>
                    <option value="81">+81 JP</option>
                    <option value="1">+1 US</option>
                  </select>
                  <input
                    value={phoneModal.phoneInput}
                    onChange={(e) => phoneModal.setPhoneInput(e.target.value)}
                    placeholder="01012345678"
                    className="flex-1 border border-divider rounded-lg px-4 py-3 text-body bg-page focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              {phoneModal.phoneError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">{phoneModal.phoneError}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={phoneModal.savePhoneAndContinue}
                  disabled={phoneModal.phoneLoading}
                  className="flex-1 py-3.5 rounded-lg bg-primary text-surface font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {phoneModal.phoneLoading ? '저장 중...' : '정보 등록하고 구독'}
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
        <TermsContent />
      </FullScreenModal>

      {/* 개인정보취급방침 모달 */}
      <FullScreenModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="개인정보취급방침"
      >
        <PrivacyContent />
      </FullScreenModal>

      {/* 쿠폰 코드 등록 확인 모달 */}
      <ConfirmModal
        isOpen={showRedeemConfirm}
        onClose={() => setShowRedeemConfirm(false)}
        onConfirm={handleRedeemCode}
        title="쿠폰 코드 등록"
        message={`코드 "${redeemCodeInput.trim()}"를 등록하시겠습니까? 등록된 기간이 추가됩니다.`}
        confirmText="등록"
        cancelText="취소"
        confirmButtonColor="primary"
        loading={redeemLoading}
      />

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="로그아웃"
        message="로그아웃하시겠습니까? 진행 중인 학습이 저장되지 않을 수 있습니다."
        confirmText="로그아웃"
        cancelText="취소"
        confirmButtonColor="danger"
      />

      {/* 결제 방식 선택 모달 */}
      {showPaymentMethodModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 relative border border-divider/50">
            <button
              onClick={() => {
                setShowPaymentMethodModal(false)
                setSelectedPlan(null)
              }}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-page rounded-full transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
            <div className="pr-8">
              <h2 className="text-xl font-bold text-text-main mb-2">
                결제 방식 선택
              </h2>
              <p className="text-sm text-text-sub">
                {selectedPlan === 'monthly' ? '월 구독' : '연 구독'} 결제 방식을 선택해주세요.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  setShowPaymentMethodModal(false)
                  if (selectedPlan === 'monthly') {
                    await payment.handleSubscribe('monthly')
                  } else {
                    await payment.handleSubscribe('yearly')
                  }
                  setSelectedPlan(null)
                }}
                disabled={payment.payLoading === selectedPlan || payment.payLoadingKakao === selectedPlan}
                className="w-full py-3.5 rounded-xl bg-primary text-surface text-sm font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>💳</span>
                <span>카드 결제</span>
              </button>
              <button
                onClick={async () => {
                  setShowPaymentMethodModal(false)
                  if (selectedPlan === 'monthly') {
                    await payment.handleSubscribeKakao('monthly')
                  } else {
                    await payment.handleSubscribeKakao('yearly')
                  }
                  setSelectedPlan(null)
                }}
                disabled={payment.payLoading === selectedPlan || payment.payLoadingKakao === selectedPlan}
                className="w-full py-3.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>💛</span>
                <span>카카오페이</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

