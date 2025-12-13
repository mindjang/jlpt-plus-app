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
          startDate = new Date(today)
          startDate.setMonth(startDate.getMonth() - 1)
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
        // 월간: 주 단위 (4주)
        for (let week = 0; week < 4; week++) {
          const weekStart = new Date(startDate)
          weekStart.setDate(weekStart.getDate() + week * 7)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)

          let wordTotal = 0
          let kanjiTotal = 0
          let correctTotal = 0
          let questionTotal = 0

          for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart)
            date.setDate(date.getDate() + d)
            const dateStr = date.toISOString().split('T')[0]
            const activity = activities[dateStr]

            if (activity) {
              wordTotal += activity.contentBreakdown.word.questions
              kanjiTotal += activity.contentBreakdown.kanji.questions
              correctTotal += activity.contentBreakdown.word.correct + activity.contentBreakdown.kanji.correct
              questionTotal += activity.totalQuestions
            }
          }

          barData.push({
            name: `${week + 1}주`,
            word: wordTotal,
            kanji: kanjiTotal,
          })

          const accuracy = questionTotal > 0 ? (correctTotal / questionTotal) * 100 : 0
          lineData.push({
            date: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            accuracy: Math.round(accuracy),
            questions: questionTotal,
          })
        }
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
    <div className="space-y-6">
      {/* 오늘의 학습 정보 */}
      <TodayOverview />

      {/* 연간 히트맵 */}
      <StudyHeatmap />

      {/* 기간 선택 탭 */}
      <div className="bg-surface rounded-card shadow-soft p-2 flex gap-2">
        {(['week', 'month', 'year', 'all'] as PeriodType[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-card text-body font-medium transition-colors ${
              period === p
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-page'
            }`}
          >
            {p === 'week' ? '주' : p === 'month' ? '월' : p === 'year' ? '년' : '전체'}
          </button>
        ))}
      </div>

      {/* 학습 시간 차트 */}
      {!loading && chartData.length > 0 && (
        <>
          <div className="bg-surface rounded-card shadow-soft p-4">
            <h3 className="text-body font-semibold text-text-main mb-4">학습 시간</h3>
            <div className="text-center py-8 text-body text-text-sub">
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
        <div className="bg-surface rounded-card shadow-soft p-8 text-center">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      )}
    </div>
  )
}

