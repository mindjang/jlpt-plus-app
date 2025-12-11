'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelCard } from '@/components/ui/LevelCard'
import { levels, Level } from '@/data'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Swiper CSS
import 'swiper/css'
import 'swiper/css/pagination'

export default function AcquirePage() {
  const router = useRouter()
  const [swiper, setSwiper] = useState<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleLevelClick = (level: Level, type: 'word' | 'kanji') => {
    router.push(`/acquire/auto-study/${level.toLowerCase()}?type=${type}`)
  }

  return (
    <div className="w-full overflow-hidden">
      <AppBar 
        title="도서관" 
        showMenu
        rightAction={
          <button
            onClick={() => router.push('/stats')}
            className="button-press w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
            aria-label="독서 기록"
          >
            <svg
              className="w-5 h-5 text-text-main"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        }
      />

      <div className="flex flex-col gap-4 relative">
        {/* 레벨 스와이퍼 */}
        <div className="w-full min-h-[60vh] flex items-center justify-center overflow-hidden">
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
            initialSlide={0}
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
                  <div className="flex items-center justify-center w-full h-full">
                  <LevelCard
                    level={level}
                    onClick={() => router.push(`/acquire/auto-study/${level.toLowerCase()}?type=word`)}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* 페이지 인디케이터 */}
        <div className="absolute top-4 left-0 right-0 flex gap-2 justify-center z-10">
          {levels.map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all ${
                index === activeIndex
                  ? `bg-primary w-6 h-2`
                  : 'bg-white w-2 h-2'
              }`}
              onClick={() => {
                swiper?.slideTo(index)
              }}
            />
          ))}
        </div>
        
      </div>
    </div>
  )
}

