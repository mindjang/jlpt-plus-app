'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { PaywallOverlay } from '@/components/membership/PaywallOverlay'

interface LoginRequiredScreenProps {
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  description?: string
  showBrowseButton?: boolean
  browseButtonText?: string
  browseButtonPath?: string
}

export function LoginRequiredScreen({
  title = '로그인이 필요해요',
  showBackButton = false,
  onBack,
  description = '학습 기록을 저장하고<br />프리미엄 기능을 이용해보세요.',
  showBrowseButton = true,
  browseButtonText = '둘러보기',
  browseButtonPath = '/acquire',
}: LoginRequiredScreenProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="w-full overflow-hidden relative min-h-[70vh] bg-page">
      <AppBar title={title} onBack={showBackButton ? handleBack : undefined} />
      <div className="p-5 flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-4xl">🔒</div>
        <h2 className="text-2xl font-bold text-text-main mb-2">{title}</h2>
        <p className="text-text-sub text-center mb-8 leading-relaxed max-w-xs whitespace-pre-line" dangerouslySetInnerHTML={{ __html: description }} />
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 rounded-lg bg-black text-white font-bold text-lg active:opacity-80"
          >
            로그인하기
          </button>
          {showBrowseButton && (
            <button
              onClick={() => router.push(browseButtonPath)}
              className="w-full py-4 rounded-lg bg-white border border-gray-200 text-gray-900 font-bold text-lg active:bg-gray-50"
            >
              {browseButtonText}
            </button>
          )}
          <button
            onClick={handleBack}
            className="w-full py-4 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg active:bg-gray-200"
          >
            뒤로가기
          </button>
        </div>
      </div>
      <PaywallOverlay
        title={title}
        description={description}
        showRedeem={false}
        showPlans={false}
        showLogin
        showBackButton={true}
        onBack={handleBack}
      />
    </div>
  )
}

