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
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([])
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

      // 히트맵 셀 생성
      const cells = generateHeatmapCells(year, cached)
      setHeatmapData(cells)
    } catch (error) {
      console.error('[StudyHeatmap] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHeatmapCells = (
    year: number,
    activities: Record<string, DailyActivity>
  ): HeatmapCell[] => {
    const cells: HeatmapCell[] = []
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    // 첫 주의 시작일 (일요일)
    const firstDay = startDate.getDay()
    const calendarStart = new Date(startDate)
    calendarStart.setDate(calendarStart.getDate() - firstDay)

    let currentDate = new Date(calendarStart)

    // 53주 * 7일 생성
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const activity = activities[dateStr]
        const count = activity?.totalQuestions || 0

        // 레벨 계산 (0: 없음, 1-4: 문제 수에 따라)
        let level = 0
        if (count > 0) {
          if (count >= 50) level = 4
          else if (count >= 30) level = 3
          else if (count >= 10) level = 2
          else level = 1
        }

        cells.push({
          date: dateStr,
          count,
          level,
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return cells
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
      <div className="bg-surface rounded-card shadow-soft p-4">
        <div className="h-32 animate-pulse bg-gray-200 rounded" />
      </div>
    )
  }

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const days = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-card shadow-soft p-4"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-semibold text-text-main">연간 학습</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            disabled={year <= 2020}
            className="px-2 py-1 text-label text-text-main hover:text-primary disabled:opacity-30"
          >
            ◀
          </button>
          <span className="text-body font-medium text-text-main min-w-[60px] text-center">
            {year}
          </span>
          <button
            onClick={handleNextYear}
            disabled={year >= new Date().getFullYear()}
            className="px-2 py-1 text-label text-text-main hover:text-primary disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 히트맵 */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 월 레이블 */}
          <div className="flex mb-1">
            <div className="w-6" /> {/* 요일 레이블 공간 */}
            {months.map((month, i) => (
              <div
                key={month}
                className="text-label text-text-sub"
                style={{ width: '44px', fontSize: '10px' }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* 히트맵 그리드 */}
          <div className="flex">
            {/* 요일 레이블 */}
            <div className="flex flex-col mr-1">
              {days.map((day, i) => (
                <div
                  key={day}
                  className="text-label text-text-sub flex items-center justify-end"
                  style={{ height: '11px', fontSize: '10px', lineHeight: '11px' }}
                >
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* 셀 그리드 (주 단위) */}
            <div className="flex gap-[2px]">
              {Array.from({ length: 53 }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const cellIndex = weekIndex * 7 + dayIndex
                    const cell = heatmapData[cellIndex]

                    if (!cell) return null

                    return (
                      <div
                        key={cell.date}
                        className={`w-[10px] h-[10px] rounded-sm ${getLevelColor(cell.level)} hover:ring-1 hover:ring-primary transition-all cursor-pointer`}
                        title={`${cell.date}: ${cell.count}문제`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

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
        </div>
      </div>
    </motion.div>
  )
}

