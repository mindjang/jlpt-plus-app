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
import { getUserReports } from '@/lib/firebase/firestore/reports'
import type { ContentReport } from '@/lib/firebase/firestore/reports'
import { TermsContent } from '@/data/legal/terms'
import { PrivacyContent } from '@/data/legal/privacy'
import { motion } from 'framer-motion'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  LogOut,
  User,
  Shield,
  FileText,
  Star,
  Crown,
  Target,
  Gift,
  Clock,
  CheckCircle2,
  Languages,
  X,
  AlertCircle
} from 'lucide-react'
import { Suspense } from 'react'
import { DailyTargetModal } from '@/components/ui/DailyTargetModal'

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
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDestructive
      ? 'bg-red-50 text-red-400'
      : 'bg-amber-50 text-orange-500' // Brand-aligned color
      }`}>
      <Icon size={18} strokeWidth={2.5} fill={isDestructive ? 'none' : 'currentColor'} fillOpacity={0.2} />
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className={`text-label font-medium ${isDestructive ? 'text-red-400' : 'text-text-sub'}`}>
        {label}
      </div>
    </div>
    {value && (
      <div className="text-body font-bold text-text-main mr-2 flex-shrink-0">
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
  const [billingInfo, setBillingInfo] = useState<{
    paymentMethod?: 'CARD' | 'EASY_PAY'
    easyPayProvider?: string
    isRecurring?: boolean
  } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [reports, setReports] = useState<ContentReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)

  // 결제 정보 가져오기
  useEffect(() => {
    const fetchBillingInfo = async () => {
      if (!user || !showManageModal) return
      try {
        const idToken = await user.getIdToken()
        const resp = await fetch('/api/billing/info', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })
        if (resp.ok) {
          const data = await resp.json()
          setBillingInfo(data.billingInfo)
        }
      } catch (error) {
        console.error('[MyPage] Failed to fetch billing info', error)
      }
    }
    fetchBillingInfo()
  }, [user, showManageModal])

  // 신고 내역 가져오기
  useEffect(() => {
    if (showReportsModal && user && reports.length === 0 && !reportsLoading) {
      loadReports()
    }
    // 모달이 닫힐 때 에러 상태 초기화
    if (!showReportsModal) {
      setReportsError(null)
    }
  }, [showReportsModal, user])

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'subscription' | 'one-time'>('subscription') // 정기구독 / 단건결제 탭
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>('monthly') // 선택된 플랜

  // Check for payment query param to auto-open modal or handle payment success
  useEffect(() => {
    // 모바일 결제 로그 확인 (리다이렉트 후에도 확인 가능)
    try {
      const paymentLogs = sessionStorage.getItem('paymentLogs')
      if (paymentLogs) {
        const logs = JSON.parse(paymentLogs)
        logger.info('[Payment] Mobile payment logs from sessionStorage', { logs })
        // 로그 확인 후 삭제하지 않음 (디버깅용으로 유지)
      }
    } catch (e) {
      // 로그 확인 실패 시 무시
    }

    const paymentParam = searchParams.get('payment')
    // PortOne V2 SDK는 리다이렉트 시 imp_uid를 쿼리 파라미터로 전달
    // 빌링키는 직접 전달되지 않으므로 imp_uid로 서버에서 조회 필요
    const billingKey = searchParams.get('billingKey') // 직접 전달되는 경우 (일반적이지 않음)
    const plan = searchParams.get('plan') as 'monthly' | 'quarterly' | null
    const paymentMethod = searchParams.get('paymentMethod') as 'CARD' | 'EASY_PAY' | null

    // localStorage에서 대기 중인 결제 정보 확인
    let pendingPayment: { plan: string; paymentMethod: string; easyPayProvider?: string; timestamp: number } | null = null
    if (typeof window !== 'undefined') {
      const pendingStr = localStorage.getItem('pendingPayment')
      if (pendingStr) {
        try {
          const parsed = JSON.parse(pendingStr)
          // 10분 이상 지난 대기 결제는 무시
          if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
            localStorage.removeItem('pendingPayment')
          } else {
            pendingPayment = parsed
          }
        } catch (e) {
          localStorage.removeItem('pendingPayment')
        }
      }
    }

    // 결제 성공/실패 후 리다이렉트 처리 (모바일)
    // PortOne V2 SDK는 리다이렉트 시 imp_uid를 쿼리 파라미터로 전달
    // imp_uid로 빌링키를 조회해야 함
    if (paymentParam === 'success' && user) {
      const impUid = searchParams.get('imp_uid')
      const merchantUid = searchParams.get('merchant_uid')
      const impSuccess = searchParams.get('imp_success')
      const failureCode = searchParams.get('code')
      const pgCode = searchParams.get('pgCode')
      const pgMessage = searchParams.get('pgMessage')
      const paymentId = searchParams.get('paymentId')
      const isOneTimePayment = paymentId?.includes('onetime')

      logger.info('[Payment] Payment redirect detected', {
        impUid,
        merchantUid,
        impSuccess,
        failureCode,
        pgCode,
        pgMessage,
        paymentId,
        isOneTimePayment,
        hasBillingKey: !!billingKey,
        plan: plan || (pendingPayment ? pendingPayment.plan : null),
        paymentMethod: paymentMethod || (pendingPayment ? pendingPayment.paymentMethod : null),
        timestamp: Date.now(),
      })

      // 단건결제 실패 케이스 처리 (먼저 체크)
      // payment=success 파라미터가 있어도 실패 코드가 있으면 실패로 처리
      if (isOneTimePayment && (failureCode === 'FAILURE_TYPE_PG' || impSuccess === 'false' || pgCode)) {
        const errorMsg = decodeURIComponent(pgMessage || searchParams.get('message') || '결제에 실패했습니다.')
        logger.error('[Payment] One-time payment failed', {
          failureCode,
          pgCode,
          pgMessage: errorMsg,
          paymentId,
          timestamp: Date.now(),
        })
        // URL에서 파라미터 제거 (먼저 처리)
        router.replace('/my', { scroll: false })
        // 에러 메시지 표시
        setMessage({ type: 'error', text: errorMsg })
        // 결제 모달 다시 열기 (재시도 가능하도록)
        // URL 정리 후 모달 열기 (약간의 지연으로 URL 변경 완료 대기)
        setTimeout(() => {
          setShowPaymentModal(true)
        }, 300)
        return
      }

      // 모바일에서 빌링키 발급 완료 후 리다이렉트된 경우
      const completeMobilePayment = async () => {
        try {
          let finalBillingKey = billingKey
          let finalPlan: 'monthly' | 'quarterly' | null = plan || (pendingPayment ? (pendingPayment.plan as 'monthly' | 'quarterly') : null)
          let finalPaymentMethod: 'CARD' | 'EASY_PAY' = paymentMethod || (pendingPayment ? (pendingPayment.paymentMethod as 'CARD' | 'EASY_PAY') : 'EASY_PAY') || 'EASY_PAY'
          let finalEasyPayProvider: string | undefined = pendingPayment?.easyPayProvider

          // imp_success가 false이면 실패
          if (impSuccess === 'false') {
            const errorCode = searchParams.get('error_code')
            const errorMsg = searchParams.get('error_msg')
            logger.error('[Payment] Payment failed on redirect', {
              errorCode,
              errorMsg,
              impUid,
            })
            setMessage({ type: 'error', text: errorMsg || '결제에 실패했습니다.' })
            if (pendingPayment) {
              localStorage.removeItem('pendingPayment')
            }
            return
          }

          // imp_uid가 있으면 서버에서 빌링키 조회
          if (!finalBillingKey && impUid) {
            logger.info('[Payment] Fetching billing key from server using imp_uid', {
              impUid,
              timestamp: Date.now(),
            })

            const idToken = await user.getIdToken()
            const billingKeyResp = await fetch('/api/pay/get-billing-key', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({ impUid }),
            })

            const billingKeyData = await billingKeyResp.json()
            if (billingKeyResp.ok && billingKeyData.billingKey) {
              finalBillingKey = billingKeyData.billingKey
              logger.info('[Payment] Billing key retrieved successfully', {
                impUid,
                billingKeyLength: finalBillingKey?.length,
                timestamp: Date.now(),
              })
            } else {
              logger.error('[Payment] Failed to retrieve billing key', {
                impUid,
                error: billingKeyData?.error,
                timestamp: Date.now(),
              })
              setMessage({ type: 'error', text: billingKeyData?.error || '빌링키를 찾을 수 없습니다. 고객센터에 문의해주세요.' })
              if (pendingPayment) {
                localStorage.removeItem('pendingPayment')
              }
              return
            }
          }

          // 빌링키가 여전히 없으면 에러
          if (!finalBillingKey) {
            logger.warn('[Payment] Billing key not found', {
              impUid,
              timestamp: Date.now(),
            })
            setMessage({ type: 'error', text: '빌링키를 찾을 수 없습니다. 고객센터에 문의해주세요.' })
            if (pendingPayment) {
              localStorage.removeItem('pendingPayment')
            }
            return
          }

          if (!finalPlan) {
            setMessage({ type: 'error', text: '결제 정보를 찾을 수 없습니다.' })
            if (pendingPayment) {
              localStorage.removeItem('pendingPayment')
            }
            return
          }

          const idToken = await user.getIdToken()
          const resp = await fetch('/api/pay/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              billingKey: finalBillingKey,
              plan: finalPlan,
              paymentMethod: finalPaymentMethod,
              easyPayProvider: finalEasyPayProvider,
              customer: {
                fullName: user.displayName || user.email?.split('@')[0] || '사용자',
                email: user.email || undefined,
                phoneNumber: phoneNumber || undefined,
              },
            }),
          })

          const data = await resp.json()
          if (resp.ok) {
            logger.info('[Payment] Mobile payment completed successfully', {
              plan: finalPlan,
              paymentMethod: finalPaymentMethod,
              easyPayProvider: finalEasyPayProvider,
              timestamp: Date.now(),
            })
            // localStorage 정리
            if (pendingPayment) {
              localStorage.removeItem('pendingPayment')
            }
            // URL에서 파라미터 제거
            router.replace('/my')
            // 멤버십 정보 새로고침
            await refresh()
            // 성공 메시지 표시
            setMessage({ type: 'success', text: '결제가 완료되었습니다.' })
            setTimeout(() => setMessage(null), 3000)
          } else {
            logger.error('[Payment] Mobile payment API failed', {
              plan: finalPlan,
              error: data?.error,
              timestamp: Date.now(),
            })
            setMessage({ type: 'error', text: data?.error || '결제 처리에 실패했습니다.' })
            if (pendingPayment) {
              localStorage.removeItem('pendingPayment')
            }
          }
        } catch (error) {
          logger.error('[Payment] Mobile payment completion error', error)
          setMessage({ type: 'error', text: '결제 처리 중 오류가 발생했습니다.' })
          if (pendingPayment) {
            localStorage.removeItem('pendingPayment')
          }
        }
      }

      completeMobilePayment()
      return
    }

    // 일반 결제 모달 열기
    if (paymentParam === 'true' && user) {
      logger.info('[Payment] Modal auto-opened from paywall', {
        membershipStatus,
        timestamp: Date.now(),
      })
      setShowPaymentModal(true)
    }
  }, [searchParams, user, membershipStatus, refresh, router])

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
    router.push('/login')
  }

  const loadReports = async () => {
    if (!user) return
    setReportsLoading(true)
    setReportsError(null)
    try {
      const userReports = await getUserReports(user.uid)
      setReports(userReports)
    } catch (error) {
      handleError(error, '신고 내역 로드')
      setReportsError('신고 내역을 불러오는데 실패했습니다.')
    } finally {
      setReportsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  // 결제 수단 표시 함수
  const getPaymentMethodLabel = (paymentMethod?: 'CARD' | 'EASY_PAY', easyPayProvider?: string): string => {
    if (!paymentMethod) return '미등록'
    if (paymentMethod === 'CARD') return '신용카드'
    if (paymentMethod === 'EASY_PAY') {
      if (easyPayProvider) {
        const providerMap: Record<string, string> = {
          'KAKAOPAY': '카카오페이',
          'NAVERPAY': '네이버페이',
          'TOSS': '토스페이',
          'PAYCO': '페이코',
          'SSG': 'SSG페이',
          'LPAY': 'L페이',
          'KPAY': 'K페이',
          'INIPAY': '이니시스',
          'PAYPAL': '페이팔',
          'APPLEPAY': '애플페이',
          'SAMSUNGPAY': '삼성페이',
          'LPOINT': 'L포인트',
          'SKPAY': 'SK페이',
        }
        return providerMap[easyPayProvider] || '간편결제'
      }
      return '간편결제'
    }
    return '미등록'
  }

  // 구독 취소 처리
  const handleCancelSubscription = async () => {
    if (!user) return

    setCancelling(true)
    try {
      const idToken = await user.getIdToken()
      const resp = await fetch('/api/pay/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await resp.json()
      if (!resp.ok) {
        setMessage({ type: 'error', text: data.error || '구독 취소에 실패했습니다.' })
        setCancelling(false)
        setShowCancelConfirm(false)
        return
      }

      setMessage({ type: 'success', text: '구독이 취소되었습니다. ' + data.expiresAtFormatted + '까지 사용 가능합니다.' })
      setShowCancelConfirm(false)
      if (refresh) await refresh()

      // BillingInfo 다시 로드
      const billingResp = await fetch('/api/billing/info', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })
      if (billingResp.ok) {
        const billingData = await billingResp.json()
        setBillingInfo(billingData.billingInfo)
      }
    } catch (error) {
      handleError(error, '구독 취소')
      setMessage({ type: 'error', text: '구독 취소 중 오류가 발생했습니다.' })
    } finally {
      setCancelling(false)
    }
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
            const isAutoRenewing = isPremium && membership?.source === 'subscription' && billingInfo?.isRecurring !== false

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
                      <div className="flex items-center gap-2">
                        <span className="text-subtitle font-bold text-text-main truncate">{user.displayName || '사용자'}</span>
                        <span className="text-label text-text-hint font-medium">계정</span>
                      </div>
                      <p className="text-body font-medium text-text-sub mt-0.5 truncate">{user.email}</p>
                      {isPremium ? (
                        <div className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 rounded-full text-label font-bold ring-1 ring-orange-100">
                          <span>Premium Member</span>
                        </div>
                      ) : (
                        <button onClick={() => { setShowPaymentModal(true); }} className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 bg-gray-100 text-text-sub rounded-full text-label font-bold active:bg-gray-200">
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
                    className={`relative overflow-hidden rounded-lg p-4 shadow-card ${isPremium
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
                            <div className="font-bold text-subtitle mt-0.5">
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
                  <div className="bg-surface rounded-lg overflow-hidden shadow-soft">
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
                  </div>

                  <div className="bg-surface rounded-lg overflow-hidden shadow-soft">
                    <SectionTitle>계정 설정</SectionTitle>
                    <MenuItem icon={User} label="프로필 수정" onClick={() => phoneModal.setShowPhoneModal(true)} />
                    <MenuItem icon={Gift} label="쿠폰 등록" onClick={() => { setRedeemCodeInput(''); setShowRedeemConfirm(true); }} />
                  </div>

                  <div className="bg-surface rounded-lg overflow-hidden shadow-soft">
                    <SectionTitle>지원 및 정보</SectionTitle>
                    <MenuItem icon={FileText} label="이용약관" onClick={() => setShowTermsModal(true)} />
                    <MenuItem icon={Shield} label="개인정보 처리방침" onClick={() => setShowPrivacyModal(true)} />
                    <MenuItem icon={AlertCircle} label="나의 신고내역" onClick={() => setShowReportsModal(true)} />
                  </div>

                  <div className="bg-surface rounded-lg overflow-hidden shadow-soft">
                    <MenuItem icon={LogOut} label="로그아웃" onClick={() => setShowLogoutConfirm(true)} isDestructive showArrow={false} />
                  </div>
                </div>

                {/* --- MODALS --- */}

                <DailyTargetModal
                  isOpen={showDailyTargetModal}
                  onClose={() => setShowDailyTargetModal(false)}
                  initialValue={settings.dailyNewLimit}
                  onSave={async (val) => {
                    await updateDailyNewLimit(val)
                  }}
                />

                {/* 1. Manage Modal (New) */}
                {showManageModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-sm rounded-lg p-6 shadow-card relative animate-in fade-in zoom-in-95 duration-200">
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
                        {isAutoRenewing && billingInfo?.paymentMethod && (
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="text-label text-text-sub">결제 수단</span>
                            <span className="text-body font-semibold text-text-main">
                              {getPaymentMethodLabel(billingInfo.paymentMethod, billingInfo.easyPayProvider)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-label text-text-sub">{isAutoRenewing ? '다음 결제' : '만료 예정'}</span>
                          <span className="text-body font-bold text-text-main">{new Date(membership!.expiresAt!).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {isAutoRenewing ? (
                          <>
                            <button
                              onClick={() => {
                                setShowManageModal(false)
                                setShowPaymentModal(true)
                              }}
                              className="w-full py-3.5 px-4 rounded-lg bg-white border border-gray-200 text-text-main text-body font-semibold active:bg-gray-50"
                            >
                              결제 수단 변경
                            </button>
                            <button
                              onClick={() => setShowCancelConfirm(true)}
                              className="w-full py-3.5 px-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-body font-semibold active:bg-red-100"
                            >
                              구독 취소
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setShowManageModal(false); setShowPaymentModal(true); }}
                            className="w-full py-3.5 rounded-lg bg-black text-white font-semibold active:opacity-80 text-body"
                          >
                            기간 연장 (구독/단건)
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
                        {process.env.NODE_ENV === 'development' && <div className="flex items-center gap-2">
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                            테스트 모드
                          </span>
                          <span className="text-xs text-gray-500">실제 결제되지 않습니다</span>
                        </div>}
                      </div>

                      {/* Tabs */}
                      <div className="px-6 py-2 shrink-0">
                        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => {
                              setPaymentTab('subscription')
                              setSelectedPlanId('monthly') // 정기구독 탭으로 전환 시 1개월 선택
                            }}
                            className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${paymentTab === 'subscription'
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
                            className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${paymentTab === 'one-time'
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
                        {/* 구매 후 바로 사용 가능 안내 */}
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800 font-medium">
                              구매 후 바로 사용 가능합니다
                            </p>
                          </div>
                        </div>

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
                <div className="px-4 py-4">
                  <p className="text-label text-text-sub text-center mb-2">Version 1.0.0</p>

                  <div className="text-center text-label text-text-sub mb-2">
                    <span className="font-semibold text-text-main">재미찾는개발자</span>
                    <span className="px-2 text-text-sub">·</span>
                    <span>사업자번호 547-12-02515</span>
                  </div>

                  {/* 연락처 정보 (접을 수 있음) */}
                  <button
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="w-full flex items-center justify-center gap-1 text-label text-text-sub active:opacity-70 py-1"
                  >
                    <span>연락처 정보</span>
                    {showContactInfo ? (
                      <ChevronUp size={14} className="text-text-sub" />
                    ) : (
                      <ChevronDown size={14} className="text-text-sub" />
                    )}
                  </button>

                  {showContactInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-center text-label text-text-sub space-y-1"
                    >
                      <div>장준영 | 010-8412-0241 | mcd.jang@gmail.com</div>
                      <div>경기도 성남시 수정고 논골로 24</div>
                    </motion.div>
                  )}
                </div>

                <FullScreenModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="이용약관"><TermsContent /></FullScreenModal>
                <FullScreenModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="개인정보취급방침"><PrivacyContent /></FullScreenModal>

                {/* 신고 내역 모달 */}
                {showReportsModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 max-w-lg mx-auto">
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="bg-surface w-full sm:rounded-[40px] rounded-t-[32px] shadow-2xl relative h-[85vh] sm:h-auto max-h-[85vh] flex flex-col"
                    >
                      {/* Header */}
                      <div className="p-6 pb-4 shrink-0 border-b border-divider">
                        <div className="flex justify-between items-center">
                          <h2 className="text-display-s font-black text-gray-900">나의 신고내역</h2>
                          <button
                            onClick={() => setShowReportsModal(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-500"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        {reportsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse text-text-sub">로딩 중...</div>
                          </div>
                        ) : reportsError ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                              <AlertCircle size={24} className="text-red-500" />
                            </div>
                            <p className="text-body text-red-600 mb-2">{reportsError}</p>
                            <button
                              onClick={loadReports}
                              className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-text-main active:bg-gray-200"
                            >
                              다시 시도
                            </button>
                          </div>
                        ) : reports.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <AlertCircle size={24} className="text-gray-400" />
                            </div>
                            <p className="text-body text-text-sub">신고 내역이 없습니다.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {reports.map((report) => (
                              <div
                                key={report.id}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-gray-200">
                                      {report.contentType === 'word' ? '단어' : '한자'}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-gray-200">
                                      {report.level}
                                    </span>
                                  </div>
                                  <span className="text-xs text-text-sub">
                                    {formatDate(report.createdAt)}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <p className="text-sm font-semibold text-text-main mb-1">
                                    {report.contentText}
                                  </p>
                                  <p className="text-xs text-text-sub line-clamp-2">
                                    {report.reason}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}

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
                        {message && (
                          <div className={`text-label text-center font-medium px-4 py-2 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
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

                {/* 구독 취소 확인 모달 */}
                <ConfirmModal
                  isOpen={showCancelConfirm}
                  onClose={() => setShowCancelConfirm(false)}
                  onConfirm={handleCancelSubscription}
                  title="구독 취소"
                  message={
                    membership?.expiresAt
                      ? `구독을 취소하시겠습니까?<br />${new Date(membership.expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 사용할 수 있습니다.`
                      : '구독을 취소하시겠습니까?'
                  }
                  confirmText={cancelling ? '처리 중...' : '구독 취소'}
                  cancelText="취소"
                  confirmButtonColor="danger"
                />
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
