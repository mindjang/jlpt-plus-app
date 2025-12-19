'use client'

import React from 'react'
import { TodayOverview } from './TodayOverview'
import { StudyHeatmap } from './StudyHeatmap'
import { StudyBarChart } from './StudyBarChart'
import { ProgressLineChart } from './ProgressLineChart'
import { useAuth } from '@/components/auth/AuthProvider'
import { getRangeActivity } from '@/lib/firebase/firestore/dailyActivity'
import { useState, useEffect } from 'react'

type PeriodType = 'week' | 'month' | 'year' | 'all'

export function PeriodStats() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<PeriodType>('week')
  const [chartData, setChartData] = useState<any[]>([])
  const [lineChartData, setLineChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadPeriodData()
    }
  }, [user, period])

  const loadPeriodData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const today = new Date()
      let startDate: Date
      const endDate = today.toISOString().split('T')[0]

      switch (period) {
        case 'week':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          // 해당 월의 1일부터 오늘까지
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(today)
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        case 'all':
          startDate = new Date(2020, 0, 1) // 시작일
          break
        default:
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 7)
      }

      const startDateStr = startDate.toISOString().split('T')[0]
      const activities = await getRangeActivity(user.uid, startDateStr, endDate)

      // 막대 그래프 데이터
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const barData: any[] = []
      const lineData: any[] = []

      if (period === 'week') {
        // 주간: 일~토 7개
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate)
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          const activity = activities[dateStr]

          const wordCount = activity?.contentBreakdown.word.questions || 0
          const kanjiCount = activity?.contentBreakdown.kanji.questions || 0
          const total = wordCount + kanjiCount
          const correct = (activity?.contentBreakdown.word.correct || 0) + (activity?.contentBreakdown.kanji.correct || 0)
          const accuracy = total > 0 ? (correct / total) * 100 : 0

          barData.push({
            name: days[date.getDay()],
            word: wordCount,
            kanji: kanjiCount,
          })

          lineData.push({
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            accuracy: Math.round(accuracy),
            questions: total,
          })
        }
      } else if (period === 'month') {
        // 월간: 해당 월의 모든 날짜를 주 단위로 그룹화
        const monthStart = new Date(startDate)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0) // 해당 월의 마지막 날
        const daysInMonth = monthEnd.getDate()
        
        // 주 단위로 그룹화 (최대 5주)
        const weeks: { start: Date; end: Date }[] = []
        let currentWeekStart = new Date(monthStart)
        
        while (currentWeekStart <= monthEnd) {
          const weekEnd = new Date(currentWeekStart)
          weekEnd.setDate(Math.min(weekEnd.getDate() + 6, monthEnd.getDate()))
          weeks.push({ start: new Date(currentWeekStart), end: new Date(weekEnd) })
          currentWeekStart.setDate(currentWeekStart.getDate() + 7)
        }

        weeks.forEach((week, weekIndex) => {
          let wordTotal = 0
          let kanjiTotal = 0
          let correctTotal = 0
          let questionTotal = 0

          // 해당 주의 모든 날짜 처리
          const currentDate = new Date(week.start)
          while (currentDate <= week.end && currentDate <= monthEnd) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const activity = activities[dateStr]

            if (activity) {
              wordTotal += activity.contentBreakdown.word.questions || 0
              kanjiTotal += activity.contentBreakdown.kanji.questions || 0
              correctTotal += (activity.contentBreakdown.word.correct || 0) + (activity.contentBreakdown.kanji.correct || 0)
              questionTotal += activity.totalQuestions || 0
            }
            
            currentDate.setDate(currentDate.getDate() + 1)
          }

          barData.push({
            name: `${weekIndex + 1}주`,
            word: wordTotal,
            kanji: kanjiTotal,
          })

          const accuracy = questionTotal > 0 ? (correctTotal / questionTotal) * 100 : 0
          lineData.push({
            date: `${week.start.getMonth() + 1}/${week.start.getDate()}`,
            accuracy: Math.round(accuracy),
            questions: questionTotal,
          })
        })
      } else {
        // 연간/전체: 월 단위
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        const monthCount = period === 'year' ? 12 : Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

        for (let i = 0; i < monthCount; i++) {
          const monthStart = new Date(startDate)
          monthStart.setMonth(monthStart.getMonth() + i)
          const monthEnd = new Date(monthStart)
          monthEnd.setMonth(monthEnd.getMonth() + 1)

          let wordTotal = 0
          let kanjiTotal = 0
          let correctTotal = 0
          let questionTotal = 0

          for (const dateStr in activities) {
            const activityDate = new Date(dateStr)
            if (activityDate >= monthStart && activityDate < monthEnd) {
              const activity = activities[dateStr]
              wordTotal += activity.contentBreakdown.word.questions
              kanjiTotal += activity.contentBreakdown.kanji.questions
              correctTotal += activity.contentBreakdown.word.correct + activity.contentBreakdown.kanji.correct
              questionTotal += activity.totalQuestions
            }
          }

          barData.push({
            name: months[monthStart.getMonth()],
            word: wordTotal,
            kanji: kanjiTotal,
          })

          const accuracy = questionTotal > 0 ? (correctTotal / questionTotal) * 100 : 0
          lineData.push({
            date: `${monthStart.getMonth() + 1}월`,
            accuracy: Math.round(accuracy),
            questions: questionTotal,
          })
        }
      }

      setChartData(barData)
      setLineChartData(lineData)
    } catch (error) {
      console.error('[PeriodStats] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 오늘의 학습 정보 */}
      <TodayOverview />

      {/* 연간 히트맵 */}
      <StudyHeatmap />

      {/* 기간 선택 탭 */}
      <div className="bg-surface rounded-lg border border-divider p-1 flex gap-1">
        {(['week', 'month', 'year', 'all'] as PeriodType[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-body font-medium transition-colors ${
              period === p
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-sub active:bg-gray-50'
            }`}
          >
            {p === 'week' ? '주' : p === 'month' ? '월' : p === 'year' ? '년' : '전체'}
          </button>
        ))}
      </div>

      {/* 학습 시간 차트 */}
      {!loading && chartData.length > 0 && (
        <>
          <div className="bg-surface rounded-lg border border-divider p-4">
            <h3 className="text-body font-semibold text-text-main mb-3">학습 시간</h3>
            <div className="text-center py-6 text-body text-text-sub">
              학습 기록이 없어요.
            </div>
          </div>

          {/* 학습량 차트 */}
          <StudyBarChart data={chartData} period={period === 'all' ? 'year' : period} />

          {/* 정답률 추이 */}
          {lineChartData.length > 0 && (
            <ProgressLineChart data={lineChartData} title="학습량" />
          )}
        </>
      )}

      {loading && (
        <div className="bg-surface rounded-lg border border-divider p-6 text-center">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      )}
    </div>
  )
}

