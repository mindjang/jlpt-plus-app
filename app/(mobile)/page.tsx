'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelCard } from '@/components/ui/LevelCard'
import { StreakChip } from '@/components/ui/StreakChip'
import { levels, Level } from '@/data'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Swiper CSS
import 'swiper/css'
import 'swiper/css/pagination'

export default function MobileHomePage() {
  const router = useRouter()
  const [swiper, setSwiper] = useState<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleLevelClick = (level: Level) => {
    router.push(`/auto-study/${level.toLowerCase()}`)
  }

  return (
    <div className="w-full overflow-hidden">
      {/* AppBar */}
      <AppBar title="Mogu-JLPT" showMenu />

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-full overflow-hidden px-4">
          {/* 상단 Streak 칩 */}
          <StreakChip count={0} />

          {/* 레벨 스와이퍼 */}
          <div className="w-full max-w-full max-h-[500px] min-h-[300px] flex items-center justify-center overflow-hidden">
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
              slideToClickedSlide={false}
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

          {/* 커스텀 페이지 인디케이터 */}
          <div className="flex gap-2">
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
