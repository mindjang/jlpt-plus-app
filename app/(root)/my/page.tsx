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
import { handleError } from '@/lib/utils/error/errorHandler'
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
  CheckCircle2
} from 'lucide-react'

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
    className="w-full flex items-center gap-4 py-4 px-4 hover:bg-black/5 active:bg-black/5 transition-colors group border-b border-gray-100 last:border-0"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDestructive ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-gray-50 text-gray-600 group-hover:bg-black/10 group-hover:text-black'
      }`}>
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="flex-1 text-left">
      <div className={`font-semibold ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
        {label}
      </div>
    </div>
    {value && (
      <div className="text-sm font-medium text-gray-500 mr-2">
        {value}
      </div>
    )}
    {showArrow && (
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    )}
  </button>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">
    {children}
  </h3>
)

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
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDailyTargetModal, setShowDailyTargetModal] = useState(false)
  const [dailyTargetDraft, setDailyTargetDraft] = useState(settings.dailyNewLimit)
  const [dailyTargetSaving, setDailyTargetSaving] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'subscription' | 'pass'>('subscription')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // 전화번호 모달 관리
  const phoneModal = usePhoneModal({
    user,
    onSuccess: async (normalizedPhone, normalizedName) => {
      setPhoneNumber(normalizedPhone)
      setDisplayName(normalizedName)
      setNameInput(normalizedName)

      // If we were trying to buy a subscription, resume
      if (payment.pendingPlan) {
        await payment.handleSubscribe(payment.pendingPlan)
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

  const handlePlaceholderPayment = (planId: string) => {
    // TODO: Implement actual One-Time Payment (Pass) logic here or via usePayment
    alert(`'${planId}' 이용권 결제 기능은 준비 중입니다.\n구독을 이용해주세요!`)
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

  if (!user) {
    return (
      <div className="w-full overflow-hidden relative min-h-[70vh] bg-page">
        <AppBar title="마이페이지" />
        <div className="p-5 flex flex-col items-center justify-center pt-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-4xl">🔒</div>
          <h2 className="text-2xl font-bold text-text-main mb-2">로그인이 필요해요</h2>
          <p className="text-text-sub text-center mb-8 leading-relaxed max-w-xs">
            학습 기록을 저장하고<br />프리미엄 기능을 이용해보세요.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => router.push('/login')} className="w-full py-4 rounded-xl bg-black text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/20">
              로그인하기
            </button>
            <button onClick={() => router.push('/acquire')} className="w-full py-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-lg hover:bg-gray-50 active:scale-[0.98] transition-all">
              둘러보기
            </button>
          </div>
        </div>
        <PaywallOverlay title="로그인이 필요해요" description="학습 진행 상황과 멤버십을 보려면 로그인해 주세요." showRedeem={false} showPlans={false} showLogin />
      </div>
    )
  }

  const isPremium = membershipStatus === 'member'
  const isAutoRenewing = isPremium && membership?.source === 'subscription' // Assuming 'source' distinguishes type

  return (
    <div className="w-full min-h-screen bg-page pb-24">
      <AppBar title="마이페이지" />

      {/* Profile Header */}
      <div className="px-5 pt-4 pb-8 bg-white/50 backdrop-blur-sm border-b border-gray-100/50">
        <div className="flex items-center gap-5">
          <div className="relative group">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-soft group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold border-4 border-white shadow-soft">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                <Crown size={14} fill="currentColor" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{user.displayName || '사용자'}님</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">{user.email}</p>
            {isPremium ? (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 rounded-full text-xs font-bold ring-1 ring-orange-100">
                <span>Premium Member</span>
              </div>
            ) : (
              <button onClick={() => { setShowPaymentModal(true); setPaymentTab('pass'); }} className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
                <span>Free Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Membership Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl p-6 shadow-soft ${isPremium
              ? 'bg-gradient-to-br from-gray-900 to-black text-white'
              : 'bg-white border border-gray-100'
            }`}>
          {!isPremium && (
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <Crown size={120} className="text-gray-100 -rotate-12 translate-x-8 -translate-y-8" />
            </div>
          )}

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className={`text-lg font-bold ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                  {isPremium ? 'Mogu Premium' : '프리미엄 멤버십'}
                </h2>
                <p className={`text-sm mt-1 ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isPremium ? '무제한 학습을 즐기고 계시네요!' : '더 효과적인 학습을 시작해보세요'}
                </p>
              </div>
              {isPremium && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                  D-{Math.ceil((new Date(membership!.expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="flex gap-2 mt-6">
                <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    {isAutoRenewing ? '다음 결제일' : '이용 만료일'}
                  </div>
                  <div className="font-semibold text-sm mt-0.5">
                    {new Date(membership!.expiresAt!).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowManageModal(true)}
                  className="px-5 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  관리
                </button>
              </div>
            ) : (
              <div className="space-y-3 mt-8">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentTab('subscription')
                      setShowPaymentModal(true)
                    }}
                    className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/20"
                  >
                    구독 시작하기
                  </button>
                  <button
                    onClick={() => {
                      setPaymentTab('pass')
                      setShowPaymentModal(true)
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all border border-transparent hover:border-black/5"
                  >
                    이용권 구매
                  </button>
                </div>
                <div className="text-[10px] text-center text-gray-400">
                  첫 구독 시 7일 무료 체험 제공
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Menu Group */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

          <SectionTitle>계정 설정</SectionTitle>
          <MenuItem icon={User} label="프로필 수정" onClick={() => phoneModal.setShowPhoneModal(true)} />
          <MenuItem icon={Gift} label="쿠폰 등록" onClick={() => { setRedeemCodeInput(''); setShowRedeemConfirm(true); }} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SectionTitle>지원 및 정보</SectionTitle>
          <MenuItem icon={FileText} label="이용약관" onClick={() => setShowTermsModal(true)} />
          <MenuItem icon={Shield} label="개인정보 처리방침" onClick={() => setShowPrivacyModal(true)} />
          <div className="border-t border-gray-100 my-1" />
          <MenuItem icon={LogOut} label="로그아웃" onClick={() => setShowLogoutConfirm(true)} isDestructive showArrow={false} />
        </div>

        {/* Footer Info */}
        <div className="text-center py-6">
          <p className="text-[10px] text-gray-300 uppercase tracking-widest font-semibold mb-2">Provided by Funny Devs</p>
          <p className="text-[10px] text-gray-300">Version 3.0.0</p>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Daily Target Modal */}
      {showDailyTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowDailyTargetModal(false)} className="absolute right-5 top-5 text-gray-400 hover:text-gray-900 transition-colors">✕</button>
            <div className="text-center mb-6 mt-1">
              <h2 className="text-xl font-bold text-text-main">일일 목표 설정</h2>
              <p className="text-body text-text-sub mt-1">자동 학습 목표를 조절하세요 (5~40, 5개 단위)</p>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => changeDailyTarget(-5)}
                className="w-12 h-12 rounded-full border border-divider text-title text-text-main flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <div className="text-3xl font-black text-text-main min-w-[80px] text-center">{dailyTargetDraft}</div>
              <button
                onClick={() => changeDailyTarget(5)}
                className="w-12 h-12 rounded-full border border-divider text-title text-text-main flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDailyTarget}
                disabled={dailyTargetSaving}
                className="flex-1 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60"
              >
                {dailyTargetSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setShowDailyTargetModal(false)}
                className="flex-1 py-3 rounded-xl bg-white border border-divider text-text-main font-semibold"
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
          <div className="bg-surface w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowManageModal(false)} className="absolute right-5 top-5 text-gray-400 hover:text-gray-900 transition-colors">✕</button>

            <div className="text-center mb-6 mt-2">
              <h2 className="text-xl font-bold text-gray-900">멤버십 관리</h2>
              <p className="text-sm text-gray-500 mt-1">이용 상태를 확인하고 변경합니다.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">현재 상태</span>
                <span className="text-sm font-bold text-black flex items-center gap-1">
                  {isAutoRenewing ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  {isAutoRenewing ? '정기 구독 중' : '기간 이용권 사용 중'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{isAutoRenewing ? '다음 결제' : '만료 예정'}</span>
                <span className="text-sm font-bold text-black">{new Date(membership!.expiresAt!).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              {isAutoRenewing ? (
                <>
                  <button
                    onClick={() => alert('결제 수단 변경 기능은 준비 중입니다.')}
                    className="w-full py-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition-colors text-sm"
                  >
                    결제 수단 변경
                  </button>
                  <button
                    onClick={() => alert('구독 해지는 고객센터로 문의해주세요.\n(앱 내 해지 기능 준비 중)')}
                    className="w-full py-4 rounded-xl bg-white border border-gray-200 text-red-500 font-bold hover:bg-red-50 transition-colors text-sm"
                  >
                    구독 해지 예약
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowManageModal(false); setPaymentTab('pass'); setShowPaymentModal(true); }}
                  className="w-full py-4 rounded-xl bg-black text-white font-bold hover:opacity-90 transition-colors text-sm shadow-lg shadow-black/20"
                >
                  기간 연장하기 / 구독 전환
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
            <div className="p-6 pb-2 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black text-gray-900">Premium Plan</h2>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">✕</button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-2 shrink-0">
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setPaymentTab('subscription')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentTab === 'subscription' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  정기 구독
                  <span className="ml-1.5 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">BEST</span>
                </button>
                <button
                  onClick={() => setPaymentTab('pass')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paymentTab === 'pass' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  기간 이용권
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {paymentTab === 'subscription' ? (
                <>
                  <div
                    onClick={() => setSelectedPlanId('monthly')}
                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedPlanId === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">월간 구독</span>
                      {selectedPlanId === 'monthly' && <CheckCircle2 className="text-primary" size={20} />}
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩9,900<span className="text-sm font-medium text-gray-400 ml-1">/월</span></div>
                    <p className="text-xs text-gray-500">매월 자동 결제, 언제든 해지 가능</p>
                  </div>

                  <div
                    onClick={() => setSelectedPlanId('yearly')}
                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedPlanId === 'yearly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-gray-900">연간 구독</span>
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2개월 무료</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">₩99,000<span className="text-sm font-medium text-gray-400 ml-1">/년</span></div>
                    <p className="text-xs text-gray-500">1년마다 자동 결제, 17% 할인 효과</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: '1month', name: '1개월권', price: '₩12,000' },
                      { id: '3month', name: '3개월권', price: '₩33,000' },
                      { id: '6month', name: '6개월권', price: '₩60,000' },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPlanId(item.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPlanId === item.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div>
                          <div className="font-bold text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">자동 결제 안 됨</div>
                        </div>
                        <div className="text-lg font-black text-gray-900">{item.price}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl text-xs text-blue-600 font-medium leading-relaxed">
                    💡 시험 일정이 얼마 남지 않았다면,<br />딱 필요한 기간만큼 이용권을 구매해보세요!
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-2 border-t border-gray-100 shrink-0 bg-white sm:rounded-b-[40px]">
              {paymentTab === 'subscription' ? (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      if (!selectedPlanId) return alert('플랜을 선택해주세요.')
                      await payment.handleSubscribe(selectedPlanId as 'monthly' | 'yearly')
                      setShowPaymentModal(false)
                    }}
                    disabled={!selectedPlanId || payment.payLoading !== null}
                    className="w-full py-4 rounded-2xl bg-black text-white font-bold text-base shadow-lg shadow-black/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    {payment.payLoading ? '처리 중...' : '카드 결제하기'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedPlanId) return alert('플랜을 선택해주세요.')
                      await payment.handleSubscribeKakao(selectedPlanId as 'monthly' | 'yearly')
                      setShowPaymentModal(false)
                    }}
                    disabled={!selectedPlanId || payment.payLoadingKakao !== null}
                    className="w-full py-4 rounded-2xl bg-[#FAE100] text-[#371D1E] font-bold text-base hover:opacity-90 disabled:opacity-50"
                  >
                    카카오페이로 시작하기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!selectedPlanId) return alert('이용권을 선택해주세요.')
                    handlePlaceholderPayment(selectedPlanId)
                  }}
                  className="w-full py-4 rounded-2xl bg-black text-white font-bold text-base shadow-lg shadow-black/20 hover:scale-[1.01] transition-transform"
                >
                  {selectedPlanId ? '이용권 구매하기' : '상품을 선택해주세요'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Other Modals (Phone, Terms, Privacy, Redeem, Logout) */}

      {phoneModal.showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-5 relative border border-divider/50">
            {/* ... Existing Phone Modal Content ... */}
            <button onClick={() => { phoneModal.setShowPhoneModal(false); phoneModal.setPhoneError(null); payment.setPendingPlan(null); }} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center text-text-sub hover:bg-gray-100 rounded-full transition-colors">✕</button>
            <div className="pr-8"><h2 className="text-xl font-bold text-text-main mb-2">정보 등록</h2><p className="text-sm text-text-sub leading-relaxed">원활한 서비스 이용을 위해 정보를 확인해주세요.</p></div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold text-text-main mb-2 block">이름</label><input value={phoneModal.nameInput} onChange={(e) => phoneModal.setNameInput(e.target.value)} placeholder="이름을 입력하세요" className="w-full border border-divider rounded-lg px-4 py-3 text-body bg-page focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
              <div><label className="text-sm font-semibold text-text-main mb-2 block">휴대폰 번호</label><div className="flex gap-2"><select value={phoneModal.countryCode} onChange={(e) => phoneModal.setCountryCode(e.target.value)} className="border border-divider rounded-lg px-3 py-3 bg-page text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"><option value="82">+82 KR</option><option value="81">+81 JP</option><option value="1">+1 US</option></select><input value={phoneModal.phoneInput} onChange={(e) => phoneModal.setPhoneInput(e.target.value)} placeholder="01012345678" className="flex-1 border border-divider rounded-lg px-4 py-3 text-body bg-page focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div></div>
              {phoneModal.phoneError && (<div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-600 font-medium">{phoneModal.phoneError}</p></div>)}
              <div className="flex gap-2 pt-2"><button onClick={phoneModal.savePhoneAndContinue} disabled={phoneModal.phoneLoading} className="flex-1 py-3.5 rounded-lg bg-black text-white font-semibold hover:opacity-90 transition-opacity button-press disabled:opacity-60 disabled:cursor-not-allowed">{phoneModal.phoneLoading ? '저장 중...' : '저장하기'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* 사업자 정보 푸터 */}
      <div className="py-6 text-center text-label text-text-sub">
        <span className="font-semibold text-text-main">재미찾는개발자</span>
        <span className="px-2 text-text-sub">·</span>
        <span>사업자번호 547-12-02515</span>
      </div>

      <FullScreenModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="이용약관"><TermsContent /></FullScreenModal>
      <FullScreenModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="개인정보취급방침"><PrivacyContent /></FullScreenModal>

      {showRedeemConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
            <div className="space-y-4">
              <div className="text-center"><div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><Gift size={24} /></div><h3 className="text-lg font-bold text-gray-900">쿠폰 등록</h3><p className="text-sm text-gray-500 mt-1">가지고 계신 코드를 입력해주세요.</p></div>
              <input value={redeemCodeInput} onChange={(e) => setRedeemCodeInput(e.target.value)} placeholder="ABCD-1234" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center font-mono font-bold text-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all uppercase" />
              {redeemMessage && (<div className={`text-xs text-center font-medium ${redeemMessage.includes('적용') ? 'text-green-600' : 'text-red-500'}`}>{redeemMessage}</div>)}
              <div className="flex gap-2 pt-2"><button onClick={() => setShowRedeemConfirm(false)} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200">취소</button><button onClick={handleRedeemCode} disabled={redeemLoading} className="flex-1 py-3.5 rounded-2xl bg-black text-white font-bold hover:opacity-90 disabled:opacity-50">{redeemLoading ? '등록 중...' : '등록하기'}</button></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} title="로그아웃" message="정말 로그아웃 하시겠습니까?" confirmText="로그아웃" cancelText="취소" confirmButtonColor="danger" />
    </div>
  )
}
