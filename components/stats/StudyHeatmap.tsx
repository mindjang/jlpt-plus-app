'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getRangeActivity } from '@/lib/firebase/firestore/dailyActivity'
import { getCachedStats, setCachedStats, getHeatmapKey } from '@/lib/cache/statsCache'
import type { DailyActivity } from '@/lib/types/stats'
import { motion } from 'framer-motion'

interface HeatmapCell {
  date: string
  count: number
  level: number // 0-4 (색상 강도)
}

export function StudyHeatmap() {
  const { user } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [firstHalfData, setFirstHalfData] = useState<HeatmapCell[]>([]) // 1-6월
  const [secondHalfData, setSecondHalfData] = useState<HeatmapCell[]>([]) // 7-12월
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadHeatmapData()
    }
  }, [user, year])

  const loadHeatmapData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const cacheKey = getHeatmapKey(user.uid, year)
      let cached = getCachedStats(cacheKey, 60 * 60 * 1000) // 1시간 TTL

      if (!cached) {
        // 해당 년도의 1월 1일 ~ 12월 31일
        const startDate = `${year}-01-01`
        const endDate = `${year}-12-31`

        const activities = await getRangeActivity(user.uid, startDate, endDate)
        cached = activities
        setCachedStats(cacheKey, activities)
      }

      // 히트맵 셀 생성 (상반기/하반기 분리)
      const { firstHalf, secondHalf } = generateHeatmapCells(year, cached)
      setFirstHalfData(firstHalf)
      setSecondHalfData(secondHalf)
    } catch (error) {
      console.error('[StudyHeatmap] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHeatmapCells = (
    year: number,
    activities: Record<string, DailyActivity>
  ): { firstHalf: HeatmapCell[]; secondHalf: HeatmapCell[] } => {
    const firstHalf: HeatmapCell[] = [] // 1-6월
    const secondHalf: HeatmapCell[] = [] // 7-12월

    // 상반기: 1월 1일 ~ 6월 30일
    const firstHalfStart = new Date(year, 0, 1)
    const firstHalfEnd = new Date(year, 5, 30) // 6월 30일

    // 하반기: 7월 1일 ~ 12월 31일
    const secondHalfStart = new Date(year, 6, 1) // 7월 1일
    const secondHalfEnd = new Date(year, 11, 31) // 12월 31일

    // 상반기 셀 생성
    const firstHalfFirstDay = firstHalfStart.getDay()
    const firstHalfCalendarStart = new Date(firstHalfStart)
    firstHalfCalendarStart.setDate(firstHalfCalendarStart.getDate() - firstHalfFirstDay)

    let currentDate = new Date(firstHalfCalendarStart)
    const firstHalfEndDate = new Date(firstHalfEnd)
    firstHalfEndDate.setDate(firstHalfEndDate.getDate() + (6 - firstHalfEndDate.getDay())) // 마지막 주의 토요일까지

    while (currentDate <= firstHalfEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const activity = activities[dateStr]
      const count = activity?.totalQuestions || 0

      // 레벨 계산
      let level = 0
      if (count > 0) {
        if (count >= 50) level = 4
        else if (count >= 30) level = 3
        else if (count >= 10) level = 2
        else level = 1
      }

      // 해당 날짜가 상반기 범위 내에 있는지 확인
      if (currentDate >= firstHalfStart && currentDate <= firstHalfEnd) {
        firstHalf.push({
          date: dateStr,
          count,
          level,
        })
      } else {
        // 범위 밖이지만 주를 맞추기 위해 빈 셀 추가
        firstHalf.push({
          date: dateStr,
          count: 0,
          level: 0,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 하반기 셀 생성
    const secondHalfFirstDay = secondHalfStart.getDay()
    const secondHalfCalendarStart = new Date(secondHalfStart)
    secondHalfCalendarStart.setDate(secondHalfCalendarStart.getDate() - secondHalfFirstDay)

    currentDate = new Date(secondHalfCalendarStart)
    const secondHalfEndDate = new Date(secondHalfEnd)
    secondHalfEndDate.setDate(secondHalfEndDate.getDate() + (6 - secondHalfEndDate.getDay())) // 마지막 주의 토요일까지

    while (currentDate <= secondHalfEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const activity = activities[dateStr]
      const count = activity?.totalQuestions || 0

      // 레벨 계산
      let level = 0
      if (count > 0) {
        if (count >= 50) level = 4
        else if (count >= 30) level = 3
        else if (count >= 10) level = 2
        else level = 1
      }

      // 해당 날짜가 하반기 범위 내에 있는지 확인
      if (currentDate >= secondHalfStart && currentDate <= secondHalfEnd) {
        secondHalf.push({
          date: dateStr,
          count,
          level,
        })
      } else {
        // 범위 밖이지만 주를 맞추기 위해 빈 셀 추가
        secondHalf.push({
          date: dateStr,
          count: 0,
          level: 0,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return { firstHalf, secondHalf }
  }

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-gray-100'
      case 1:
        return 'bg-blue-100'
      case 2:
        return 'bg-blue-300'
      case 3:
        return 'bg-blue-500'
      case 4:
        return 'bg-blue-700'
      default:
        return 'bg-gray-100'
    }
  }

  const handlePrevYear = () => {
    if (year > 2020) setYear(year - 1)
  }

  const handleNextYear = () => {
    const currentYear = new Date().getFullYear()
    if (year < currentYear) setYear(year + 1)
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-divider p-4">
        <div className="h-32 animate-pulse bg-gray-200 rounded" />
      </div>
    )
  }

  const firstHalfMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']
  const secondHalfMonths = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const days = ['일', '월', '화', '수', '목', '금', '토']

  // 주 수 계산
  const getWeekCount = (cells: HeatmapCell[]) => {
    return Math.ceil(cells.length / 7)
  }

  const firstHalfWeeks = getWeekCount(firstHalfData)
  const secondHalfWeeks = getWeekCount(secondHalfData)

  const renderHeatmapGrid = (cells: HeatmapCell[], months: string[], label: string, startMonth: number) => {
    // 정확한 주 수 계산 (셀 배열 길이를 7로 나눈 올림값)
    const weekCount = Math.ceil(cells.length / 7)
    
    // 마지막 주가 완전히 채워지지 않았으면 빈 셀 추가
    const totalCellsNeeded = weekCount * 7
    const cellsToRender = [...cells]
    while (cellsToRender.length < totalCellsNeeded) {
      cellsToRender.push({
        date: '',
        count: 0,
        level: 0,
      })
    }
    
    // 각 월의 시작 주 인덱스 계산
    const monthWeekPositions: { month: string; weekIndex: number }[] = []
    const periodStart = new Date(year, startMonth, 1)
    const periodFirstDay = periodStart.getDay()
    const periodCalendarStart = new Date(periodStart)
    periodCalendarStart.setDate(periodCalendarStart.getDate() - periodFirstDay)
    
    months.forEach((month, monthIndex) => {
      const monthStart = new Date(year, startMonth + monthIndex, 1)
      const firstDay = monthStart.getDay()
      const calendarStart = new Date(monthStart)
      calendarStart.setDate(calendarStart.getDate() - firstDay)
      
      const weekIndex = Math.floor((calendarStart.getTime() - periodCalendarStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      monthWeekPositions.push({ month, weekIndex })
    })
    
    return (
      <div className="mb-6">
        <div className="text-label font-semibold text-text-main mb-2">{label}</div>
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="inline-block min-w-full">
            {/* 월 레이블 */}
            <div className="flex mb-1 relative h-4">
              <div className="w-6" /> {/* 요일 레이블 공간 */}
              <div className="flex-1 relative">
                {monthWeekPositions.map(({ month, weekIndex }) => (
                  <div
                    key={month}
                    className="text-label text-text-sub absolute"
                    style={{ 
                      left: `calc(${weekIndex}*(100%/26))`,
                      fontSize: '10px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* 히트맵 그리드 */}
            <div className="flex items-start">
              {/* 요일 레이블 */}
              <div className="flex flex-col mr-1 gap-[2px]">
                {days.map((day, i) => (
                  <div
                    key={day}
                    className="text-label text-text-sub flex items-center justify-end"
                    style={{ 
                      fontSize: '10px', 
                      lineHeight: '1',
                      minHeight: '14px',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 셀 그리드 (주 단위) */}
              <div className="flex-1 flex gap-[2px]">
                {Array.from({ length: weekCount }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const cellIndex = weekIndex * 7 + dayIndex
                      const cell = cellsToRender[cellIndex]

                      // 셀이 없거나 빈 셀이면 빈 셀 렌더링
                      if (!cell || !cell.date) {
                        return (
                          <div
                            key={`empty-${weekIndex}-${dayIndex}`}
                            className="w-full aspect-square rounded-sm bg-gray-100"
                          />
                        )
                      }

                      return (
                        <div
                          key={cell.date}
                          className={`w-full aspect-square rounded-sm ${getLevelColor(cell.level)} active:ring-1 active:ring-primary cursor-pointer`}
                          title={`${cell.date}: ${cell.count}문제`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg border border-divider p-4"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-semibold text-text-main">연간 학습</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            disabled={year <= 2020}
            className="px-2 py-1 text-label text-text-main active:text-primary disabled:opacity-30"
          >
            ◀
          </button>
          <span className="text-body font-medium text-text-main min-w-[60px] text-center">
            {year}
          </span>
          <button
            onClick={handleNextYear}
            disabled={year >= new Date().getFullYear()}
            className="px-2 py-1 text-label text-text-main active:text-primary disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 상반기 히트맵 */}
      {renderHeatmapGrid(firstHalfData, firstHalfMonths, '상반기 (1-6월)', 0)}

      {/* 하반기 히트맵 */}
      {renderHeatmapGrid(secondHalfData, secondHalfMonths, '하반기 (7-12월)', 6)}

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-label text-text-sub mr-1">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-[10px] h-[10px] rounded-sm ${getLevelColor(level)}`}
          />
        ))}
        <span className="text-label text-text-sub ml-1">More</span>
      </div>
    </motion.div>
  )
}

