'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../auth/AuthProvider'
import { useMembership } from './MembershipProvider'
import { logger } from '@/lib/utils/logger'

interface PaywallOverlayProps {
  title?: string
  description?: string
  showRedeem?: boolean
  onRedeem?: (code: string) => Promise<void>
  showLogin?: boolean
  showPlans?: boolean
  onClose?: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export function PaywallOverlay({
  title = '오늘처럼 매일 학습하고 싶으신가요?',
  description = '지금도 충분히 잘 하고 계세요.<br />현재는 하루 1회만 학습할 수 있어요. 회원이 되시면 오늘처럼 매일 학습할 수 있어요.',
  showRedeem = true,
  onRedeem,
  showLogin = true,
  showPlans = true,
  onClose,
  onBack,
  showBackButton = false,
}: PaywallOverlayProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { redeemCode: membershipRedeemCode, refresh: refreshMembership } = useMembership()
  const [code, setCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Track paywall view
  useEffect(() => {
    logger.info('[Paywall] Overlay shown', {
      title,
      hasUser: !!user,
      showPlans,
      showRedeem,
      timestamp: Date.now(),
    })
  }, [])

  const handleRedeem = async () => {
    // onRedeem prop이 있으면 사용, 없으면 useMembership의 redeemCode 사용
    const redeemFunction = onRedeem || membershipRedeemCode
    
    if (!redeemFunction) {
      setMessage('쿠폰 등록 기능을 사용할 수 없습니다.')
      return
    }
    
    if (!code || code.length < 8) {
      setMessage('8자리 코드를 입력해주세요.')
      return
    }
    
    if (!user) {
      setMessage('로그인이 필요합니다.')
      return
    }
    
    setMessage(null)
    setRedeemLoading(true)
    try {
      await redeemFunction(code.trim())
      setMessage('코드가 적용되었어요!')
      setCode('')
      
      // membership 상태 갱신
      if (refreshMembership) {
        await refreshMembership()
      }
      
      // 성공 후 잠시 대기 후 페이지 새로고침 또는 모달 닫기
      setTimeout(() => {
        if (onClose) {
          onClose()
        } else {
          // 모달이 없으면 페이지 새로고침
          window.location.reload()
        }
      }, 1500)
    } catch (error: any) {
      setMessage(error?.message || '코드 적용에 실패했습니다.')
    } finally {
      setRedeemLoading(false)
    }
  }

  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-lg shadow-soft p-6 space-y-4 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-text-sub active:text-text-main"
            aria-label="닫기"
          >
            ✕
          </button>
        )}
        <div className="space-y-2">
          <h2 className="text-title font-semibold text-text-main">{title}</h2>
          <p className="text-body text-text-sub whitespace-pre-line" dangerouslySetInnerHTML={{ __html: description }} />
        </div>

        {showPlans && (
          <div className="space-y-3">

            {/* 혜택 설명 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-label font-medium text-blue-900">회원이 되시면:</p>
              <ul className="text-body text-blue-800 space-y-1 text-sm">
                <li>• 오늘처럼 매일 학습할 수 있어요</li>
                <li>• 복습 카드를 원하는 만큼 처리할 수 있어요</li>
                <li>• 학습 통계를 더 자세히 볼 수 있어요</li>
              </ul>
            </div>
            
            <button
              className="w-full py-3 rounded-lg bg-black text-white text-body font-semibold active:opacity-80"
              onClick={() => {
                logger.info('[Paywall] CTA clicked - Navigate to payment', {
                  destination: '/my?payment=true&tab=subscription',
                  hasUser: !!user,
                  timestamp: Date.now(),
                })
                router.push('/my?payment=true&tab=subscription')
              }}
            >
              구독 플랜 보기
            </button>
            
            {/* 선택권 강조 메시지 */}
            <p className="text-label text-text-sub text-center">
              지금도 충분히 괜찮아요. 나중에 결정하셔도 돼요.
            </p>
          </div>
        )}

        {showRedeem && (
          <div className="space-y-2">
            <label className="text-label text-text-sub">8자리 코드 등록</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={16}
                placeholder="예: ABCD-1234"
                className="flex-1 shadow-soft rounded-lg px-3 py-2 text-body"
              />
              <button
                disabled={redeemLoading}
                onClick={handleRedeem}
                className="px-4 py-3 bg-page shadow-soft rounded-lg text-body font-medium active:bg-gray-50"
              >
                {redeemLoading ? '적용중...' : '등록'}
              </button>
            </div>
          </div>
        )}

        {showLogin && (
          <button
            className="w-full py-3 rounded-lg bg-page shadow-soft text-body font-medium active:bg-gray-50"
            onClick={() => {
              if (user) {
                router.push('/home')
              } else {
                router.push(`/login?next=${encodeURIComponent(currentPath)}`)
              }
            }}
          >
            {user ? '계정으로 이동' : '로그인하기'}
          </button>
        )}

        {showBackButton && onBack && (
          <button
            className="w-full py-3 px-4 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-body font-medium active:bg-gray-200"
            onClick={onBack}
          >
            뒤로가기
          </button>
        )}

        {message && <div className="text-label text-primary">{message}</div>}
      </div>
    </div>
  )
}
