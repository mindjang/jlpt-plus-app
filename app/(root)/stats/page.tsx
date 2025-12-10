'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { getUserData, getAllCardIds, getCardsByLevel } from '@/lib/firebase/firestore'
import { levels, Level, levelData } from '@/data'
import { getCardStatus } from '@/lib/srs/cardStatus'
import type { UserCardState } from '@/lib/types/srs'
import { useMembership } from '@/components/membership/MembershipProvider'
import { PaywallOverlay } from '@/components/membership/PaywallOverlay'

// react-calendar-heatmap은 클라이언트 사이드에서만 렌더링
const CalendarHeatmap = dynamic(
  () => import('react-calendar-heatmap').then((mod) => mod.default),
  { ssr: false }
)

type TabType = 'overall' | 'daily'
type ContentType = 'word' | 'kanji'

export default function StatsPage() {
  const { user } = useAuth()
  const { status: membershipStatus, loading: membershipLoading, redeemCode } = useMembership()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overall')
  const [contentType, setContentType] = useState<ContentType>('word')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [stats, setStats] = useState({
    learningDays: 2,
    learningTime: 107, // 초 단위 (1분 47초)
    totalLearned: 0,
    longTermMemory: 0,
    levelProgress: {} as Record<Level, { learned: number; total: number; longTerm: number }>,
  })
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number; level?: Level }>>([])

  useEffect(() => {
    if (user) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      const allCardIds = await getAllCardIds(user.uid)
      const levelProgress: Record<Level, { learned: number; total: number; longTerm: number }> = {} as any

      let totalLongTerm = 0

      for (const level of levels) {
        const levelCards = await getCardsByLevel(user.uid, level)
        const total = contentType === 'word' ? levelData[level].words : levelData[level].kanji
        
        // 장기 기억 카드 수 계산 (interval >= 21일 또는 reps >= 8)
        let longTerm = 0
        levelCards.forEach((card) => {
          if (card.type === contentType && (card.interval >= 21 || card.reps >= 8)) {
            longTerm++
          }
        })

        levelProgress[level] = {
          learned: Array.from(levelCards.values()).filter(c => c.type === contentType).length,
          total,
          longTerm,
        }
        totalLongTerm += longTerm
      }

      setStats({
        learningDays: 2, // TODO: 실제 계산 필요
        learningTime: 107, // TODO: 실제 계산 필요
        totalLearned: Array.from(allCardIds).length,
        longTermMemory: totalLongTerm,
        levelProgress,
      })

      // 히트맵 데이터 생성 (임시: 실제로는 Firestore에서 날짜별 학습 기록 가져와야 함)
      const heatmap: Array<{ date: string; count: number; level?: Level }> = []
      const year = 2025
      const startDate = new Date(year, 0, 1)
      
      // 레벨별 시작일 계산
      const sepStart = new Date(year, 8, 1).getTime() // 9월 1일
      const sepEnd = new Date(year, 8, 30).getTime() // 9월 30일
      const octStart = new Date(year, 9, 1).getTime() // 10월 1일
      const octEnd = new Date(year, 9, 31).getTime() // 10월 31일
      const decStart = new Date(year, 11, 1).getTime() // 12월 1일
      const decEnd = new Date(year, 11, 31).getTime() // 12월 31일
      
      // 1년치 데이터 생성
      for (let i = 0; i < 365; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateTime = date.getTime()
        
        let count = 0
        let level: Level | undefined = undefined
        
        // 9월: N5 학습
        if (dateTime >= sepStart && dateTime <= sepEnd) {
          level = 'N5'
          count = Math.floor(Math.random() * 4) + 1 // 1-4 랜덤
        }
        // 10월: N3와 N2 학습 (랜덤으로 섞어서)
        else if (dateTime >= octStart && dateTime <= octEnd) {
          const randomLevel = Math.random() < 0.5 ? 'N3' : 'N2'
          level = randomLevel as Level
          count = Math.floor(Math.random() * 4) + 1 // 1-4 랜덤
        }
        // 12월: N1 학습
        else if (dateTime >= decStart && dateTime <= decEnd) {
          level = 'N1'
          count = Math.floor(Math.random() * 4) + 1 // 1-4 랜덤
        }
        
        heatmap.push({
          date: date.toISOString().split('T')[0],
          count,
          level,
        })
      }
      
      setHeatmapData(heatmap)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [contentType, user])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}분 ${secs}초`
    }
    return `${secs}초`
  }

  const getWeekDates = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day
    const monday = new Date(date.setDate(diff))
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const weekDates = getWeekDates(new Date(selectedWeek))

  if (loading || membershipLoading) {
    return (
      <div className="w-full">
        <AppBar title="통계" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden pb-20 relative">
      <AppBar title="통계" />

      <div className="flex flex-col gap-6 p-4">
        {/* 탭 선택 */}
        <div className="flex gap-4 border-b border-divider">
          <button
            onClick={() => setActiveTab('overall')}
            className={`pb-3 px-2 text-body font-medium transition-colors ${
              activeTab === 'overall'
                ? 'text-text-main border-b-2 border-text-main'
                : 'text-text-sub'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 px-2 text-body font-medium transition-colors ${
              activeTab === 'daily'
                ? 'text-text-main border-b-2 border-text-main'
                : 'text-text-sub'
            }`}
          >
            일별
          </button>
        </div>

        {activeTab === 'overall' ? (
          <>
            {/* 총 학습 정보 */}
            <div>
              <h2 className="text-title font-semibold text-text-main mb-1">총 학습 정보</h2>
              <p className="text-label text-text-sub mb-4">앱 등록 이후 현재까지 총 학습 정보</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface rounded-card shadow-soft p-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-label text-text-sub mb-1">학습일</div>
                  <div className="text-title font-semibold text-text-main">{stats.learningDays}일</div>
                </div>
                <div className="bg-surface rounded-card shadow-soft p-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-label text-text-sub mb-1">학습 시간</div>
                  <div className="text-title font-semibold text-text-main">{formatTime(stats.learningTime)}</div>
                </div>
              </div>
            </div>

            {/* 학습 히트맵 */}
            <div>
              <h2 className="text-title font-semibold text-text-main mb-4">학습 히트맵</h2>
              <div className="bg-surface rounded-card shadow-soft p-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button className="text-text-sub">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-body font-medium text-text-main">2025</span>
                  <button className="text-text-sub">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <CalendarHeatmap
                    startDate={new Date(2025, 0, 1)}
                    endDate={new Date(2025, 11, 31)}
                    values={heatmapData}
                    classForValue={(value) => {
                      if (!value || value.count === 0) {
                        return 'color-empty'
                      }
                      
                      // 레벨별 메인 컬러 사용
                      const level = (value as any).level
                      if (!level) return 'color-empty'
                      
                      // 레벨별 기본 클래스
                      const levelClass = `color-${level.toLowerCase()}`
                      // 학습량에 따른 진하기 (1-4)
                      const intensityClass = `-scale-${value.count}`
                      
                      return `${levelClass}${intensityClass}`
                    }}
                    tooltipDataAttrs={(value) => {
                      if (!value || !value.date) return {}
                      const level = (value as any).level
                      const levelText = level ? ` (${level})` : ''
                      return {
                        'data-tip': `${value.date}: ${value.count || 0}개 학습${levelText}`,
                      }
                    }}
                    showWeekdayLabels
                    weekdayLabels={['월', '화', '수', '목', '금', '토', '일']}
                    monthLabels={['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']}
                    gutterSize={2}
                    squareSize={11}
                  />
                </div>
                
                <style jsx global>{`
                  .react-calendar-heatmap {
                    font-family: var(--font-pretendard);
                  }
                  .react-calendar-heatmap .color-empty {
                    fill: #ebedf0;
                  }
                  
                  /* N5 (주황색) - 9월 */
                  .react-calendar-heatmap .color-n5-scale-1 {
                    fill: #ffd4a3;
                  }
                  .react-calendar-heatmap .color-n5-scale-2 {
                    fill: #ffb366;
                  }
                  .react-calendar-heatmap .color-n5-scale-3 {
                    fill: #ff8c00;
                  }
                  .react-calendar-heatmap .color-n5-scale-4 {
                    fill: #da7a13;
                  }
                  
                  /* N3 (빨강) - 10월 */
                  .react-calendar-heatmap .color-n3-scale-1 {
                    fill: #ffb3b3;
                  }
                  .react-calendar-heatmap .color-n3-scale-2 {
                    fill: #ff8080;
                  }
                  .react-calendar-heatmap .color-n3-scale-3 {
                    fill: #ff4d4d;
                  }
                  .react-calendar-heatmap .color-n3-scale-4 {
                    fill: #d33939;
                  }
                  
                  /* N2 (보라) - 10월 */
                  .react-calendar-heatmap .color-n2-scale-1 {
                    fill: #b3b3ff;
                  }
                  .react-calendar-heatmap .color-n2-scale-2 {
                    fill: #8080ff;
                  }
                  .react-calendar-heatmap .color-n2-scale-3 {
                    fill: #6666ff;
                  }
                  .react-calendar-heatmap .color-n2-scale-4 {
                    fill: #4841dc;
                  }
                  
                  /* N1 (파랑) - 12월 */
                  .react-calendar-heatmap .color-n1-scale-1 {
                    fill: #b3d9ff;
                  }
                  .react-calendar-heatmap .color-n1-scale-2 {
                    fill: #80c7ff;
                  }
                  .react-calendar-heatmap .color-n1-scale-3 {
                    fill: #4db3ff;
                  }
                  .react-calendar-heatmap .color-n1-scale-4 {
                    fill: #0f7fe1;
                  }
                  
                  .react-calendar-heatmap text {
                    font-size: 10px;
                    fill: #757575;
                  }
                  .react-calendar-heatmap .react-calendar-heatmap-small-text {
                    font-size: 5px;
                  }
                  .react-calendar-heatmap rect:hover {
                    stroke: #2a2a2a;
                    stroke-width: 1px;
                  }
                `}</style>
              </div>
            </div>

            {/* 단계별 진행상황 */}
            <div>
              <h2 className="text-title font-semibold text-text-main mb-1">단계별 진행상황</h2>
              <p className="text-label text-text-sub mb-4">앱 등록 이후 현재까지 총 학습 정보</p>
              
              {/* 단어/한자 탭 */}
              <div className="flex gap-4 border-b border-divider mb-4">
                <button
                  onClick={() => setContentType('word')}
                  className={`pb-3 px-2 text-body font-medium transition-colors ${
                    contentType === 'word'
                      ? 'text-text-main border-b-2 border-text-main'
                      : 'text-text-sub'
                  }`}
                >
                  단어
                </button>
                <button
                  onClick={() => setContentType('kanji')}
                  className={`pb-3 px-2 text-body font-medium transition-colors ${
                    contentType === 'kanji'
                      ? 'text-text-main border-b-2 border-text-main'
                      : 'text-text-sub'
                  }`}
                >
                  한자
                </button>
              </div>

              {/* 요약 카드 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface rounded-card shadow-soft p-4">
                  <div className="text-label text-text-sub mb-1">학습 {contentType === 'word' ? '단어' : '한자'}</div>
                  <div className="text-title font-semibold text-text-main">{stats.totalLearned}개</div>
                </div>
                <div className="bg-surface rounded-card shadow-soft p-4">
                  <div className="text-label text-text-sub mb-1">장기 기억 {contentType === 'word' ? '단어' : '한자'}</div>
                  <div className="text-title font-semibold text-text-main">{stats.longTermMemory}개</div>
                </div>
              </div>

              {/* 레벨별 진행률 */}
              <div className="space-y-4">
                {levels
                  .filter((level) => {
                    // 학습한 내역이 있는 레벨만 표시
                    const progress = stats.levelProgress[level] || { learned: 0, total: 0, longTerm: 0 }
                    return progress.learned > 0
                  })
                  .map((level) => {
                    const progress = stats.levelProgress[level] || { learned: 0, total: 0, longTerm: 0 }
                    const percentage = progress.total > 0 
                      ? Math.round((progress.learned / progress.total) * 100) 
                      : 0

                    const levelColors: Record<Level, string> = {
                      N5: 'bg-orange-500',
                      N4: 'bg-orange-400',
                      N3: 'bg-red-500',
                      N2: 'bg-blue-500',
                      N1: 'bg-blue-400',
                    }

                    return (
                      <div key={level} className="bg-surface rounded-card shadow-soft p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${levelColors[level]} text-white px-3 py-1 rounded-full text-label font-medium`}>
                            {level}
                          </div>
                          <div className="flex-1">
                            <div className="text-body text-text-main mb-1">
                              {progress.learned}/{progress.total} {contentType === 'word' ? '단어' : '한자'}
                            </div>
                            <div className="h-2 bg-divider rounded-full overflow-hidden">
                              <div
                                className={`h-full ${levelColors[level]} transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-body font-medium text-text-main">{percentage}%</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 주간 선택기 */}
            <div className="flex items-center justify-between mb-4">
              <button className="text-text-sub">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-body font-medium text-text-main">
                {weekDates[0].toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })} ~ {weekDates[6].toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </div>
              <button className="text-text-sub">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 일별 캘린더 */}
            <div className="bg-surface rounded-card shadow-soft p-4 mb-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-label text-text-sub">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, index) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString()
                  const hasActivity = index < 2 // 임시로 처음 2일만 활동 있음
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                        isSelected ? 'bg-gray-200' : ''
                      }`}
                    >
                      <span className={`text-body ${isSelected ? 'font-semibold text-text-main' : 'text-text-sub'}`}>
                        {date.getDate()}
                      </span>
                      {hasActivity && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 일일 학습 시간 */}
            <div className="bg-green-50 rounded-card shadow-soft p-6 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-display-s font-bold text-green-700 mb-1">1분 17초</div>
                <div className="text-body text-green-600">일일 학습 시간</div>
              </div>
            </div>

            {/* 일일 학습 정보 */}
            <div>
              <h2 className="text-title font-semibold text-text-main mb-4">일일 학습 정보</h2>
              
              {/* 단어/한자 탭 */}
              <div className="flex gap-4 border-b border-divider mb-4">
                <button
                  onClick={() => setContentType('word')}
                  className={`pb-3 px-2 text-body font-medium transition-colors ${
                    contentType === 'word'
                      ? 'text-text-main border-b-2 border-text-main'
                      : 'text-text-sub'
                  }`}
                >
                  단어
                </button>
                <button
                  onClick={() => setContentType('kanji')}
                  className={`pb-3 px-2 text-body font-medium transition-colors ${
                    contentType === 'kanji'
                      ? 'text-text-main border-b-2 border-text-main'
                      : 'text-text-sub'
                  }`}
                >
                  한자
                </button>
              </div>

              {/* 레벨별 통계 카드 */}
              <div className="space-y-3">
                {['N5', 'N4'].map((level) => {
                  const progress = stats.levelProgress[level as Level] || { learned: 0, total: 0, longTerm: 0 }
                  return (
                    <div key={level} className="bg-surface rounded-card shadow-soft p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-orange-500 text-white px-2 py-0.5 rounded text-label font-medium">
                          {level}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <div className="text-label text-text-sub">장기 기억 {contentType === 'word' ? '단어' : '한자'}</div>
                            <div className="text-body font-semibold text-text-main">{progress.longTerm}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <div className="text-label text-text-sub">학습한 {contentType === 'word' ? '단어' : '한자'}</div>
                            <div className="text-body font-semibold text-text-main">{progress.learned}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {membershipStatus !== 'member' && (
        <PaywallOverlay
          title="프리미엄에서 전체 통계를 확인하세요"
          description="일별 요약만 볼 수 있고, 전체/레벨별 상세는 회원권이 필요합니다."
          showRedeem={!!user}
          showPlans={!!user}
          onRedeem={async (code) => {
            await redeemCode(code)
          }}
        />
      )}
    </div>
  )
}
