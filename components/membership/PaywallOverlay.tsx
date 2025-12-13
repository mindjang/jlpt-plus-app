'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auth/AuthProvider'

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
  title = '프리미엄 회원만 이용할 수 있어요',
  description = '로그인 후 구독을 시작하거나 코드 등록으로 기간을 추가하세요.',
  showRedeem = true,
  onRedeem,
  showLogin = true,
  showPlans = true,
  onClose,
  onBack,
  showBackButton = false,
}: PaywallOverlayProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRedeem = async () => {
    if (!onRedeem) return
    if (!code || code.length < 8) {
      setMessage('8자리 코드를 입력해주세요.')
      return
    }
    setMessage(null)
    setRedeemLoading(true)
    try {
      await onRedeem(code.trim())
      setMessage('코드가 적용되었어요!')
      setCode('')
    } catch (error: any) {
      setMessage(error?.message || '코드 적용에 실패했습니다.')
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-lg shadow-xl p-6 space-y-4 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-text-sub hover:text-text-main"
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
          <div className="grid grid-cols-2 gap-3">
            <button
              className="w-full py-3 rounded-card bg-primary text-surface text-body font-semibold button-press"
              onClick={() => {
                setMessage('구독 결제 연동은 준비 중입니다.')
              }}
            >
              월 구독
            </button>
            <button
              className="w-full py-3 rounded-card bg-blue-500 text-surface text-body font-semibold button-press"
              onClick={() => {
                setMessage('구독 결제 연동은 준비 중입니다.')
              }}
            >
              연 구독
            </button>
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
                className="flex-1 border border-divider rounded-card px-3 py-2 text-body"
              />
              <button
                disabled={redeemLoading}
                onClick={handleRedeem}
                className="px-4 py-2 bg-page border border-divider rounded-card text-body font-medium button-press"
              >
                {redeemLoading ? '적용중...' : '등록'}
              </button>
            </div>
          </div>
        )}

        {showLogin && (
          <button
            className="w-full py-3 rounded-card bg-page border border-divider text-body font-medium button-press"
            onClick={() => {
              if (user) {
                router.push('/home')
              } else {
                router.push('/login')
              }
            }}
          >
            {user ? '계정으로 이동' : '로그인하기'}
          </button>
        )}

        {showBackButton && onBack && (
          <button
            className="w-full py-3 rounded-card bg-gray-100 border border-gray-200 text-gray-700 text-body font-medium button-press"
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
