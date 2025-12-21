'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { signOutUser } from '@/lib/firebase/auth'
import { getUserData } from '@/lib/firebase/firestore'
import { useMembership } from '@/components/membership/MembershipProvider'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { handleError } from '@/lib/utils/error/errorHandler'
import { logger } from '@/lib/utils/logger'
import { useUserSettings } from '@/hooks/useUserSettings'
import { usePhoneModal } from '@/hooks/usePhoneModal'
import { usePayment } from '@/hooks/usePayment'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { TermsContent } from '@/data/legal/terms'
import { PrivacyContent } from '@/data/legal/privacy'
import { motion, AnimatePresence } from 'framer-motion'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'
import {
  ChevronRight,
  CreditCard,
  Settings,
  BarChart2,
  LogOut,
  User,
  Shield,
  FileText,
  Star,
  Crown,
  Target,
  Gift,
  Calendar,
  Clock,
  CheckCircle2,
  Languages,
  X
} from 'lucide-react'
import { Suspense } from 'react'

// --- Helper Components ---

const MenuItem = ({
  icon: Icon,
  label,
  value,
  onClick,
  isDestructive = false,
  showArrow = true
}: {
  icon: any,
  label: string,
  value?: string | React.ReactNode,
  onClick: () => void,
  isDestructive?: boolean,
  showArrow?: boolean
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 py-3 px-4 active:bg-gray-50 group border-b border-gray-100 last:border-0"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-text-main'
      }`}>
      <Icon size={18} strokeWidth={2} />
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className={`text-body font-semibold ${isDestructive ? 'text-red-500' : 'text-text-main'}`}>
        {label}
      </div>
    </div>
    {value && (
      <div className="text-label font-medium text-text-sub mr-2 flex-shrink-0">
        {value}
      </div>
    )}
    {showArrow && (
      <ChevronRight size={16} className="text-text-sub flex-shrink-0" />
    )}
  </button>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="px-4 text-label font-semibold text-text-sub uppercase tracking-wider mb-1.5 mt-4">
    {children}
  </h3>
)

function MyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDailyTargetModal, setShowDailyTargetModal] = useState(false)
  const [dailyTargetDraft, setDailyTargetDraft] = useState(settings.dailyNewLimit)
  const [dailyTargetSaving, setDailyTargetSaving] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'subscription' | 'one-time'>('subscription') // 정기구독 / 단건결제 탭
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>('monthly') // 선택된 플랜

  // Check for payment query param to auto-open modal
  useEffect(() => {
    const shouldShowPayment = searchParams.get('payment')
    if (shouldShowPayment === 'true' && user) {
      logger.info('[Payment] Modal auto-opened from paywall', {
        membershipStatus,
        timestamp: Date.now(),
      })
      setShowPaymentModal(true)
    }
  }, [searchParams, user, membershipStatus])

  // 전화번호 모달 관리
  const phoneModal = usePhoneModal({
    user,
    onSuccess: async (normalizedPhone, normalizedName) => {
      setPhoneNumber(normalizedPhone)
      setDisplayName(normalizedName)
      setNameInput(normalizedName)

      // If we were trying to buy, resume
      if (payment.pendingPlan) {
        if (paymentTab === 'subscription' && (payment.pendingPlan === 'monthly' || payment.pendingPlan === 'quarterly')) {
          await payment.handleSubscribe(payment.pendingPlan)
        } else if (paymentTab === 'one-time' && (payment.pendingPlan === 'monthly' || payment.pendingPlan === 'yearly')) {
          await payment.handleOneTimePayment(payment.pendingPlan)
        }
      }
      // Note: Logic for 'pass' resumption would go here if we had pending pass purchase
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
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    try {
      const userData = await getUserData(user.uid)
      if (userData?.profile?.phoneNumber) setPhoneNumber(userData.profile.phoneNumber)
      else if (user.phoneNumber) setPhoneNumber(user.phoneNumber)

      const name = userData?.profile?.displayName || user.displayName || user.email?.split('@')[0]
      if (name) {
        setDisplayName(name)
        setNameInput(name)
        phoneModal.setNameInput(name)
      }
    } catch (error) {
      handleError(error, '프로필 로드')
    }
  }

  const handleLogout = async () => {
    await signOutUser()
    router.push('/my')
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
      setRedeemMessage(handleError(error, '코드 등록'))
      setShowRedeemConfirm(false)
    } finally {
      setRedeemLoading(false)
    }
  }

  const clampTarget = (val: number) => {
    const min = AUTO_STUDY_TARGET_OPTIONS[0]
    const max = AUTO_STUDY_TARGET_OPTIONS[AUTO_STUDY_TARGET_OPTIONS.length - 1]
    return Math.min(max, Math.max(min, val))
  }

  const changeDailyTarget = (delta: number) => {
    setDailyTargetDraft((prev) => clampTarget(prev + delta))
  }

  const handleSaveDailyTarget = async () => {
    if (!user) return
    try {
      setDailyTargetSaving(true)
      await updateDailyNewLimit(dailyTargetDraft)
      setShowDailyTargetModal(false)
    } catch (error) {
      handleError(error, '일일 목표 저장')
    } finally {
      setDailyTargetSaving(false)
    }
  }


  const loading = settingsLoading

  if (loading) {
    return (
      <div className="w-full">
        <AppBar title="마이페이지" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      </div>
    )
  }

    return (
    <FeatureGuard
      feature="my_page"
      customMessage={{
        title: '마이페이지',
        description: '학습 기록을 저장하고 프리미엄 기능을 이용해보세요.',
      }}
    >
      {!user ? null : (
        <>
          {(() => {
  const isPremium = membershipStatus === 'member'
            const isAutoRenewing = isPremium && membership?.source === 'subscription'

  return (
    <div className="w-full min-h-screen bg-page pb-24">
      <AppBar title="마이페이지" />

      {/* Profile Header */}
      <div className="px-4 pt-4 pb-4 bg-white/50 backdrop-blur-sm border-b border-gray-100/50">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold border-2 border-white">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {isPremium && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 text-white p-1 rounded-full border-2 border-white">
                <Crown size={12} fill="currentColor" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-title font-bold text-text-main tracking-tight truncate">{user.displayName || '사용자'}님</h1>
            <p className="text-body text-text-sub font-medium mt-0.5 truncate">{user.email}</p>
            {isPremium ? (
              <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 rounded-full text-label font-bold ring-1 ring-orange-100">
                <span>Premium Member</span>
              </div>
            ) : (
              <button onClick={() => { setShowPaymentModal(true); }} className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-gray-100 text-text-sub rounded-full text-label font-bold active:bg-gray-200">
                <span>Free Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Membership Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-lg p-4 border border-divider ${isPremium
              ? 'bg-gradient-to-br from-gray-900 to-black text-white'
              : 'bg-white border border-gray-100'
            }`}>
          {!isPremium && (
            <div className="absolute top-0 right-0 p-3 opacity-50">
              <Crown size={80} className="text-gray-100 -rotate-12 translate-x-6 -translate-y-6" />
            </div>
          )}

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className={`text-body font-semibold ${isPremium ? 'text-white' : 'text-text-main'}`}>
                  {isPremium ? 'Mogu Premium' : '프리미엄 멤버십'}
                </h2>
                <p className={`text-label mt-0.5 ${isPremium ? 'text-gray-400' : 'text-text-sub'}`}>
                  {isPremium ? '무제한 학습을 즐기고 계시네요!' : '더 효과적인 학습을 시작해보세요'}
                </p>
              </div>
              {isPremium && (
                <span className="bg-white/20 px-2.5 py-1 rounded-full text-label font-medium backdrop-blur-md flex-shrink-0">
                  D-{Math.ceil((new Date(membership!.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-white/10 rounded-lg p-3 backdrop-blur-sm relative overflow-hidden group">
                  <div className="text-label text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    {isAutoRenewing ? '다음 결제일' : '이용 만료일'}
                  </div>
                  <div className="font-semibold text-body mt-0.5">
                    {new Date(membership!.expiresAt!).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowManageModal(true)}
                  className="px-4 py-2.5 bg-white text-black rounded-lg text-body font-medium active:bg-gray-100 flex-shrink-0"
                >
                  관리
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPaymentModal(true)
                    }}
                    className="w-full py-3.5 px-4 bg-black text-white rounded-lg text-body font-semibold active:opacity-80"
                  >
                    구독 시작하기
                  </button>
                </div>
                <div className="text-label text-center text-text-sub">
                  첫 구독 시 7일 무료 체험 제공
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Menu Group */}
        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <SectionTitle>학습 관리</SectionTitle>
          <MenuItem
            icon={Target}
            label="일일 목표 설정"
            value={`${settings.dailyNewLimit}개`}
            onClick={() => {
              setDailyTargetDraft(settings.dailyNewLimit)
              setShowDailyTargetModal(true)
            }}
          />
          <MenuItem icon={BarChart2} label="나의 독서 기록" onClick={() => router.push('/stats')} />
          <MenuItem icon={Star} label="배지 갤러리" onClick={() => router.push('/quiz/badges')} />
          <MenuItem icon={Languages} label="카나" onClick={() => router.push('/kana')} />

          <SectionTitle>계정 설정</SectionTitle>
          <MenuItem icon={User} label="프로필 수정" onClick={() => phoneModal.setShowPhoneModal(true)} />
          <MenuItem icon={Gift} label="쿠폰 등록" onClick={() => { setRedeemCodeInput(''); setShowRedeemConfirm(true); }} />
        </div>

        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <SectionTitle>지원 및 정보</SectionTitle>
          <MenuItem icon={FileText} label="이용약관" onClick={() => setShowTermsModal(true)} />
          <MenuItem icon={Shield} label="개인정보 처리방침" onClick={() => setShowPrivacyModal(true)} />
          <div className="border-t border-gray-100 my-1" />
          <MenuItem icon={LogOut} label="로그아웃" onClick={() => setShowLogoutConfirm(true)} isDestructive showArrow={false} />
        </div>

        {/* Footer Info */}
        <div className="text-center py-4">
          <p className="text-label text-text-sub uppercase tracking-widest font-semibold mb-1">Provided by Funny Devs</p>
          <p className="text-label text-text-sub">Version 3.0.0</p>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Daily Target Modal */}
      {showDailyTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-lg border border-divider p-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowDailyTargetModal(false)} className="absolute right-5 top-5 text-gray-400 active:text-gray-900">✕</button>
            <div className="text-center mb-4 mt-1">
              <h2 className="text-body font-semibold text-text-main">일일 목표 설정</h2>
              <p className="text-label text-text-sub mt-1">자동 학습 목표를 조절하세요 (5~40, 5개 단위)</p>
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => changeDailyTarget(-5)}
                className="w-11 h-11 rounded-lg border border-divider text-body text-text-main flex items-center justify-center active:bg-gray-50"
              >
                -
              </button>
              <div className="text-title font-black text-text-main min-w-[80px] text-center">{dailyTargetDraft}</div>
              <button
                onClick={() => changeDailyTarget(5)}
                className="w-11 h-11 rounded-lg border border-divider text-body text-text-main flex items-center justify-center active:bg-gray-50"
              >
                +
              </button>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleSaveDailyTarget}
                disabled={dailyTargetSaving}
                className="flex-1 py-3 px-4 rounded-lg bg-black text-white text-body font-semibold disabled:opacity-60"
              >
                {dailyTargetSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setShowDailyTargetModal(false)}
                className="flex-1 py-3 rounded-lg bg-white border border-divider text-text-main font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Manage Modal (New) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-lg p-4 border border-divider relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowManageModal(false)} className="absolute right-4 top-4 text-text-sub active:text-text-main">✕</button>

            <div className="text-center mb-4 mt-1">
              <h2 className="text-body font-semibold text-text-main">멤버십 관리</h2>
              <p className="text-label text-text-sub mt-1">이용 상태를 확인하고 변경합니다.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-label text-text-sub">현재 상태</span>
                <span className="text-body font-semibold text-text-main flex items-center gap-1">
                  {isAutoRenewing ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  {isAutoRenewing ? '정기 구독 중' : '기간 이용권 사용 중'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-label text-text-sub">{isAutoRenewing ? '다음 결제' : '만료 예정'}</span>
                <span className="text-body font-bold text-text-main">{new Date(membership!.expiresAt!).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {isAutoRenewing ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2.5">
                    <p className="text-label text-blue-700">
                      💡 결제 수단 변경이나 구독 해지가 필요하신가요? 아래 방법을 이용해주세요:
                    </p>
                    <ul className="text-label text-blue-700 mt-1.5 space-y-1 list-disc list-inside">
                      <li>결제 수단 변경: 신규 결제 수단으로 재구독</li>
                      <li>구독 해지: 마이페이지 하단 연락처로 문의</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      setShowManageModal(false)
                      setShowPaymentModal(true)
                    }}
                    className="w-full py-3.5 px-4 rounded-lg bg-white border border-gray-200 text-text-main text-body font-semibold active:bg-gray-50"
                  >
                    새 결제 수단으로 재구독
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowManageModal(false); setShowPaymentModal(true); }}
                  className="w-full py-3.5 rounded-lg bg-black text-white font-semibold active:opacity-80 text-body"
                >
                  구독하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Payment Modal (Updated with Tabs) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-surface w-full sm:rounded-[40px] rounded-t-[32px] shadow-2xl relative h-[85vh] sm:h-auto flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-2 shrink-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-display-s font-black text-gray-900">Premium Plan</h2>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-500">✕</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  테스트 모드
                </span>
                <span className="text-xs text-gray-500">실제 결제되지 않습니다</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-2 shrink-0">
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setPaymentTab('subscription')
                    setSelectedPlanId('monthly') // 정기구독 탭으로 전환 시 1개월 선택
                  }}
                  className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${
                    paymentTab === 'subscription'
                      ? 'bg-white text-text-main shadow-sm'
                      : 'text-text-sub active:bg-gray-50'
                  }`}
                >
                  정기구독
                </button>
                <button
                  onClick={() => {
                    setPaymentTab('one-time')
                    setSelectedPlanId('monthly') // 단건결제 탭으로 전환 시 1개월 선택
                  }}
                  className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${
                    paymentTab === 'one-time'
                      ? 'bg-white text-text-main shadow-sm'
                      : 'text-text-sub active:bg-gray-50'
                  }`}
                >
                  단건결제
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {paymentTab === 'subscription' ? (
                <>
                  {/* 정기구독: 1개월, 3개월 */}
                  <div
                    onClick={() => setSelectedPlanId('monthly')}
                    className={`p-5 rounded-lg border cursor-pointer ${selectedPlanId === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">1개월 구독</span>
                      {selectedPlanId === 'monthly' && <CheckCircle2 className="text-primary" size={20} />}
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩4,900<span className="text-sm font-medium text-gray-400 ml-1">/월</span></div>
                    <p className="text-xs text-gray-500">매월 자동 결제, 언제든 해지 가능</p>
                  </div>

                  <div
                    onClick={() => setSelectedPlanId('quarterly')}
                    className={`p-5 rounded-lg border cursor-pointer ${selectedPlanId === 'quarterly' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">3개월 구독</span>
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">10% 할인</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩13,000<span className="text-sm font-medium text-gray-400 ml-1">/3개월</span></div>
                    <p className="text-xs text-gray-500">3개월마다 자동 결제, 언제든 해지 가능</p>
                  </div>
                </>
              ) : (
                <>
                  {/* 단건결제: 1개월, 1년 */}
                  <div
                    onClick={() => setSelectedPlanId('monthly')}
                    className={`p-5 rounded-lg border cursor-pointer ${selectedPlanId === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">1개월 이용권</span>
                      {selectedPlanId === 'monthly' && <CheckCircle2 className="text-primary" size={20} />}
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩4,900</div>
                    <p className="text-xs text-gray-500">1회 결제, 자동 갱신 없음</p>
                  </div>

                  <div
                    onClick={() => setSelectedPlanId('yearly')}
                    className={`p-5 rounded-lg border cursor-pointer ${selectedPlanId === 'yearly' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">1년 이용권</span>
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">17% 할인</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩49,000</div>
                    <p className="text-xs text-gray-500">1회 결제, 자동 갱신 없음</p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-2 border-t border-gray-100 shrink-0 bg-white sm:rounded-b-[40px]">
              <div className="space-y-3">
                  <button
                    onClick={async () => {
                      if (!selectedPlanId) return alert('플랜을 선택해주세요.')
                      if (paymentTab === 'subscription') {
                        await payment.handleSubscribeKakao(selectedPlanId as 'monthly' | 'quarterly')
                      } else {
                        await payment.handleOneTimePaymentKakao(selectedPlanId as 'monthly' | 'yearly')
                      }
                      setShowPaymentModal(false)
                    }}
                    disabled={!selectedPlanId || payment.payLoadingKakao !== null}
                    className="w-full py-4 rounded-lg bg-[#FAE100] text-[#371D1E] font-bold text-base active:opacity-80 disabled:opacity-50"
                  >
                    카카오페이로 시작하기
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedPlanId) return alert('플랜을 선택해주세요.')
                      if (paymentTab === 'subscription') {
                        await payment.handleSubscribe(selectedPlanId as 'monthly' | 'quarterly')
                      } else {
                        await payment.handleOneTimePayment(selectedPlanId as 'monthly' | 'yearly')
                      }
                      setShowPaymentModal(false)
                    }}
                    disabled={!selectedPlanId || payment.payLoading !== null}
                    className="w-full py-4 px-6 rounded-lg bg-black text-white text-body font-semibold active:opacity-80 disabled:opacity-50"
                  >
                    {payment.payLoading ? '처리 중...' : '카드 결제하기'}
                  </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Other Modals (Phone, Terms, Privacy, Redeem, Logout) */}

      {phoneModal.showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-md rounded-lg border border-divider relative my-auto">
            {/* 헤더 */}
            <div className="p-4 border-b border-divider flex items-center justify-between">
              <h2 className="text-body font-semibold text-text-main">정보 등록</h2>
              <button 
                onClick={() => { phoneModal.setShowPhoneModal(false); phoneModal.setPhoneError(null); payment.setPendingPlan(null); }} 
                className="w-8 h-8 flex items-center justify-center text-text-sub active:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-label text-text-sub">원활한 서비스 이용을 위해 정보를 확인해주세요.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-label font-semibold text-text-main mb-1.5 block">이름</label>
                  <input 
                    value={phoneModal.nameInput} 
                    onChange={(e) => phoneModal.setNameInput(e.target.value)} 
                    placeholder="이름을 입력하세요" 
                    className="w-full border border-divider rounded-lg px-3 py-2.5 text-body bg-page focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="text-label font-semibold text-text-main mb-1.5 block">휴대폰 번호</label>
                  <div className="flex gap-2 min-w-0">
                    <select 
                      value={phoneModal.countryCode} 
                      onChange={(e) => phoneModal.setCountryCode(e.target.value)} 
                      className="border border-divider rounded-lg px-3 py-2.5 bg-surface text-text-main text-body focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all shrink-0"
                      style={{ minWidth: '100px' }}
                    >
                      <option value="82">+82 KR</option>
                      <option value="81">+81 JP</option>
                      <option value="1">+1 US</option>
                    </select>
                    <input 
                      value={phoneModal.phoneInput} 
                      onChange={(e) => phoneModal.setPhoneInput(e.target.value)} 
                      placeholder="01012345678" 
                      className="flex-1 min-w-0 border border-divider rounded-lg px-3 py-2.5 text-body bg-page focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all" 
                    />
                  </div>
                </div>
                {phoneModal.phoneError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-label text-red-600 font-medium">{phoneModal.phoneError}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={phoneModal.savePhoneAndContinue} 
                    disabled={phoneModal.phoneLoading} 
                    className="flex-1 py-3.5 px-4 rounded-lg bg-primary text-white text-body font-bold active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {phoneModal.phoneLoading ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 정보 푸터 */}
      <div className="py-4 text-center text-label text-text-sub">
        <span className="font-semibold text-text-main">재미찾는개발자</span>
        <span className="px-2 text-text-sub">·</span>
        <span>사업자번호 547-12-02515</span>
      </div>

      <FullScreenModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="이용약관"><TermsContent /></FullScreenModal>
      <FullScreenModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="개인정보취급방침"><PrivacyContent /></FullScreenModal>

      {showRedeemConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-lg border border-divider relative">
            {/* 헤더 */}
            <div className="p-4 border-b border-divider flex items-center justify-between">
              <h3 className="text-body font-semibold text-text-main">쿠폰 등록</h3>
              <button 
                onClick={() => setShowRedeemConfirm(false)} 
                className="w-8 h-8 flex items-center justify-center text-text-sub active:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Gift size={20} className="text-blue-600" />
                </div>
                <p className="text-label text-text-sub">가지고 계신 코드를 입력해주세요.</p>
              </div>
              
              <input 
                value={redeemCodeInput} 
                onChange={(e) => setRedeemCodeInput(e.target.value)} 
                placeholder="ABCD-1234" 
                className="w-full bg-page border border-divider rounded-lg px-3 py-2.5 text-center font-mono font-semibold text-body focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all uppercase" 
              />
              
              {redeemMessage && (
                <div className={`text-label text-center font-medium ${redeemMessage.includes('적용') ? 'text-green-600' : 'text-red-500'}`}>
                  {redeemMessage}
                </div>
              )}
              
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setShowRedeemConfirm(false)} 
                  className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-text-main text-body font-medium active:bg-gray-200"
                >
                  취소
                </button>
                <button 
                  onClick={handleRedeemCode} 
                  disabled={redeemLoading} 
                  className="flex-1 py-3.5 px-4 rounded-lg bg-primary text-white text-body font-bold active:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  {redeemLoading ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} title="로그아웃" message="정말 로그아웃 하시겠습니까?" confirmText="로그아웃" cancelText="취소" confirmButtonColor="danger" />
    </div>
            )
          })()}
        </>
      )}
    </FeatureGuard>
  )
}

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-page flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">로딩 중...</div>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  )
}
