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
      <AppBar title="습득존" showMenu />

      <div className="flex flex-col gap-6 p-4">
        {/* 레벨 스와이퍼 */}
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
                <div className="flex items-center justify-center w-full h-full py-4">
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
        <div className="flex gap-2 justify-center">
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
  )
}

