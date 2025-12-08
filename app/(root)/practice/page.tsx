'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelCard } from '@/components/ui/LevelCard'
import { levels, Level } from '@/data'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Swiper CSS
import 'swiper/css'
import 'swiper/css/pagination'

function PracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [swiper, setSwiper] = useState<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const initialLevel = searchParams.get('level')
  const initialIndex = initialLevel
    ? levels.findIndex((l) => l.toLowerCase() === initialLevel)
    : 0

  const handleLevelClick = (level: Level) => {
    router.push(`/practice/learn?level=${level.toLowerCase()}`)
  }

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="학습존" showMenu />

      <div className="flex flex-col gap-6 p-4">
        {/* 학습 모드 선택 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/practice/learn')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press"
          >
            <div className="text-title font-semibold text-text-main mb-2">📖 예문 학습</div>
            <div className="text-body text-text-sub">SRS 기반 카드</div>
          </button>
          <button
            onClick={() => router.push('/practice/quiz')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press"
          >
            <div className="text-title font-semibold text-text-main mb-2">✏️ 객관식 퀴즈</div>
            <div className="text-body text-text-sub">문제풀이</div>
          </button>
          <button
            onClick={() => router.push('/practice/weak')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press"
          >
            <div className="text-title font-semibold text-text-main mb-2">📝 약점노트</div>
            <div className="text-body text-text-sub">틀린 문제 복습</div>
          </button>
          <button
            onClick={() => router.push('/practice')}
            className="bg-surface rounded-card shadow-soft p-6 text-center button-press"
          >
            <div className="text-title font-semibold text-text-main mb-2">🎲 혼합 모드</div>
            <div className="text-body text-text-sub">랜덤 학습</div>
          </button>
        </div>

        {/* 레벨 선택 */}
        <div>
          <h2 className="text-title font-semibold text-text-main mb-4">레벨 선택</h2>
          <div className="w-full max-h-[400px] min-h-[300px] flex items-center justify-center overflow-hidden">
            <Swiper
              onSwiper={setSwiper}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              grabCursor={true}
              modules={[Pagination, Navigation]}
              pagination={{
                clickable: true,
                enabled: false,
              }}
              className="w-full h-full swiper-simple"
              centeredSlides={true}
              initialSlide={initialIndex >= 0 ? initialIndex : 0}
              loop={false}
              slidesPerView={1}
              spaceBetween={0}
              touchRatio={1}
              threshold={15}
              resistance={true}
              resistanceRatio={0.85}
              speed={400}
            >
              {levels.map((level, index) => (
                <SwiperSlide key={level} className="flex items-center justify-center">
                  <div className="flex items-center justify-center w-full h-full py-4">
                    <LevelCard
                      level={level}
                      onClick={() => handleLevelClick(level)}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 페이지 인디케이터 */}
          <div className="flex gap-2 justify-center mt-4">
            {levels.map((_, index) => (
              <button
                key={index}
                className={`rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-primary w-6 h-2'
                    : 'bg-divider w-2 h-2'
                }`}
                onClick={() => {
                  swiper?.slideTo(index)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="학습존" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}

