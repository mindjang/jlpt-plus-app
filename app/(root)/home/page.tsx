'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { LevelCard } from '@/components/ui/LevelCard'
import { StreakChip } from '@/components/ui/StreakChip'
import { levels, Level } from '@/data'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { getUserData } from '@/lib/firebase/firestore'
import { getReviewCards } from '@/lib/firebase/firestore'
import { logger } from '@/lib/utils/logger'

// Swiper CSS
import 'swiper/css'
import 'swiper/css/pagination'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [swiper, setSwiper] = useState<SwiperType | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reviewDueCount, setReviewDueCount] = useState(0)
  const [dailyNewLimit, setDailyNewLimit] = useState(10)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      const userData = await getUserData(user.uid)
      if (userData?.settings.dailyNewLimit) {
        setDailyNewLimit(userData.settings.dailyNewLimit)
      }

      // 복습 대기 카드 수 계산
      const reviewCards = await getReviewCards(user.uid, 1000)
      setReviewDueCount(reviewCards.length)
    } catch (error) {
      logger.error('Failed to load user data:', error)
    }
  }

  const handleLevelClick = (level: Level) => {
    router.push(`/practice?level=${level.toLowerCase()}`)
  }

  const handleStartToday = () => {
    router.push('/practice')
  }

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="홈" showMenu />

      <div className="flex flex-col gap-6 p-4">
        {/* 상단 Streak 칩 */}
        <div className="flex justify-center">
          <StreakChip count={0} />
        </div>

        {/* 오늘의 학습 목표 */}
        <div className="bg-surface rounded-card shadow-soft p-6">
          <h2 className="text-title font-semibold text-text-main mb-4">오늘의 학습</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body text-text-sub">새 카드</span>
              <span className="text-body font-medium text-text-main">{dailyNewLimit}개</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-body text-text-sub">복습 대기</span>
              <span className="text-body font-medium text-text-main">{reviewDueCount}개</span>
            </div>
            <button
              onClick={handleStartToday}
              className="w-full mt-4 py-3 px-4 rounded-card bg-primary text-surface text-body font-medium button-press"
            >
              오늘 학습 시작
            </button>
          </div>
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

        {/* 빠른 경로 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/practice/learn')}
            className="bg-surface rounded-card shadow-soft p-4 text-center button-press"
          >
            <div className="text-subtitle font-medium text-text-main mb-1">단어 학습</div>
            <div className="text-label text-text-sub">예문 기반</div>
          </button>
          <button
            onClick={() => router.push('/practice/quiz')}
            className="bg-surface rounded-card shadow-soft p-4 text-center button-press"
          >
            <div className="text-subtitle font-medium text-text-main mb-1">한자 학습</div>
            <div className="text-label text-text-sub">문제풀이</div>
          </button>
          <button
            onClick={() => router.push('/acquire/search')}
            className="bg-surface rounded-card shadow-soft p-4 text-center button-press"
          >
            <div className="text-subtitle font-medium text-text-main mb-1">카나 학습</div>
            <div className="text-label text-text-sub">기초 학습</div>
          </button>
        </div>
      </div>
    </div>
  )
}

