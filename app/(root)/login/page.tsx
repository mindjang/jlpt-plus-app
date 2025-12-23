'use client'

import React, { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import Image from 'next/image'
import { BrandLoader } from '@/components/ui/BrandLoader'

export default function LoginPage() {
  // 벚꽃 꽃잎 생성
  const petals = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    // 초기 위치를 랜덤하게 설정하여 화면에 들어왔을 때 이미 떨어지고 있는 것처럼 보이게 함
    initialTop: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
    // 더 다양한 크기: 8px부터 35px까지
    size: 8 + Math.random() * 27,
  }))

  return (
    <div className="w-full min-h-screen overflow-hidden bg-gradient-to-b from-pink-100 via-white to-pink-50 relative">
      {/* 벚꽃 꽃잎 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal) => (
          <div
            key={petal.id}
            className="absolute sakura-petal"
            style={{
              left: `${petal.left}%`,
              top: `${petal.initialTop}%`,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full opacity-70">
              <path
                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM8 6C9.1 6 10 6.9 10 8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6ZM16 6C17.1 6 18 6.9 18 8C18 9.1 17.1 10 16 10C14.9 10 14 9.1 14 8C14 6.9 14.9 6 16 6ZM6 12C7.1 12 8 12.9 8 14C8 15.1 7.1 16 6 16C4.9 16 4 15.1 4 14C4 12.9 4.9 12 6 12ZM18 12C19.1 12 20 12.9 20 14C20 15.1 19.1 16 18 16C16.9 16 16 15.1 16 14C16 12.9 16.9 12 18 12ZM12 18C13.1 18 14 18.9 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18Z"
                fill="#FFB6C1"
              />
              <circle cx="12" cy="12" r="4" fill="#FFC0CB" />
            </svg>
          </div>
        ))}
      </div>

      <div className="min-h-screen flex flex-col items-center justify-between relative py-24 z-10">
        <div className="flex-1 flex flex-col items-center gap-5 text-center">
          <h1 className="text-4xl font-black" style={{ 
            fontFamily: 'var(--font-mungyeong), MungyeongGamhongApple, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: '1.2',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          }}>Mogu JLPT</h1>
          <p className="text-lg text-gray-700">JLPT 시험 대비 반복 학습</p>
        </div>
        {/* 모구 캐릭터 이미지 */}
        <div className="absolute bottom-14 mx-auto max-w-80">
          <Image
            src="/mask/mogu_side.png"
            alt="모구 캐릭터"
            width={280}
            height={256}
            className="object-contain drop-shadow-2xl !w-screen"
            priority
          />
        </div>
        
        {/* 로그인 폼 */}
        <div className="w-full max-w-lg z-10">
          <Suspense fallback={
            <div className="p-6 flex items-center justify-center">
              <BrandLoader size={48} text="로딩 중..." />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
        
      </div>
    </div>
  )
}

