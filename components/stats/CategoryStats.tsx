'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyActivity, getRangeActivity } from '@/lib/firebase/firestore/dailyActivity'
import { getQuizStats, getAllQuizStats } from '@/lib/firebase/firestore/quiz'
import { getUserQuizLevel } from '@/lib/firebase/firestore/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { StudyBarChart } from './StudyBarChart'
import { CategoryPieChart } from './CategoryPieChart'

type CategoryType = 'word' | 'kanji' | 'quiz' | 'game'

export function CategoryStats() {
  const { user } = useAuth()
  const [category, setCategory] = useState<CategoryType>('word')
  const [weekData, setWeekData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadCategoryData()
    }
  }, [user, category])

  const loadCategoryData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 주간 데이터 로드
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const startDate = weekAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]

      const activities = await getRangeActivity(user.uid, startDate, endDate)

      // 주간 막대 그래프
      const days = ['토', '일', '월', '화', '수', '목', '오늘']
      const barData: any[] = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        const activity = activities[dateStr]

        let value = 0
        if (category === 'word') {
          value = activity?.contentBreakdown.word.questions || 0
        } else if (category === 'kanji') {
          value = activity?.contentBreakdown.kanji.questions || 0
        } else if (category === 'quiz') {
          value = activity?.modeBreakdown.quiz.questions || 0
        } else if (category === 'game') {
          value = activity?.modeBreakdown.game.questions || 0
        }

        barData.push({
          name: i === 6 ? '오늘' : days[date.getDay()],
          value,
        })
      }

      setWeekData(barData)

      // 카테고리별 통계
      if (category === 'word' || category === 'kanji') {
        const allStats = await getAllQuizStats(user.uid)
        const levelStats: any[] = []

        ;(['N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevel[]).forEach((level) => {
          const stat = allStats[level]
          const questions = stat.totalQuestions
          levelStats.push({
            name: level,
            value: questions,
          })
        })

        setPieData(levelStats)

        // 트로피 & 총 문제 수
        const totalQuestions = Object.values(allStats).reduce(
          (sum, s) => sum + s.totalQuestions,
          0
        )
        setStats({
          trophy: Math.floor(totalQuestions / 10), // 간단한 계산
          totalQuestions,
        })
      } else if (category === 'quiz') {
        const userLevel = await getUserQuizLevel(user.uid)
        const allStats = await getAllQuizStats(user.uid)

        const totalQuestions = Object.values(allStats).reduce(
          (sum, s) => sum + s.totalQuestions,
          0
        )

        setStats({
          trophy: userLevel.level,
          totalQuestions,
        })

        // 퀴즈 타입별 파이 차트
        const todayActivity = await getDailyActivity(user.uid)
        const quizBreakdown = todayActivity?.quizTypeBreakdown || {
          wordToMeaning: 0,
          meaningToWord: 0,
          sentenceFillIn: 0,
        }

        setPieData([
          { name: '단어→뜻', value: quizBreakdown.wordToMeaning },
          { name: '뜻→단어', value: quizBreakdown.meaningToWord },
          { name: '문장 완성', value: quizBreakdown.sentenceFillIn },
        ])
      }
    } catch (error) {
      console.error('[CategoryStats] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = () => {
    switch (category) {
      case 'word':
        return '어휘'
      case 'kanji':
        return '한자'
      case 'quiz':
        return '퀴즈'
      case 'game':
        return '게임'
    }
  }

  const getCategoryIcon = () => {
    switch (category) {
      case 'word':
        return '📖'
      case 'kanji':
        return '字'
      case 'quiz':
        return '✏️'
      case 'game':
        return '🎮'
    }
  }

  return (
    <div className="space-y-4">
      {/* 카테고리 탭 */}
      <div className="bg-surface rounded-lg border border-divider p-1 flex gap-1 overflow-x-auto">
        {(['word', 'kanji', 'quiz', 'game'] as CategoryType[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-2 rounded-lg text-body font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-sub active:bg-gray-50'
            }`}
          >
            {cat === 'word' ? '어휘' : cat === 'kanji' ? '한자' : cat === 'quiz' ? '퀴즈' : '게임'}
          </button>
        ))}
      </div>

      {/* 카테고리별 트로피 & 통계 */}
      {stats && (
        <div className="bg-surface rounded-lg border border-divider p-4">
          <h2 className="text-body font-semibold text-text-main mb-3">
            {getCategoryIcon()} {getCategoryName()} 학습
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-label text-text-sub mb-1">
                {getCategoryName()} 트로피
              </div>
              <div className="text-title font-bold text-text-main">
                {stats.trophy}
              </div>
            </div>
            <div>
              <div className="text-label text-text-sub mb-1">총 학습 문제</div>
              <div className="text-title font-bold text-text-main">
                {stats.totalQuestions.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7일 학습 정보 */}
      {!loading && weekData.length > 0 && (
        <div className="bg-surface rounded-lg border border-divider p-4">
          <h3 className="text-body font-semibold text-text-main mb-4">학습 정보</h3>
          <div className="flex items-end gap-1.5 mb-3">
            {weekData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary rounded-t"
                  style={{
                    height: `${Math.max((day.value / Math.max(...weekData.map((d) => d.value), 1)) * 100, 5)}px`,
                    minHeight: '4px',
                  }}
                />
                <div className="text-label text-text-sub mt-1">
                  {day.name}
                </div>
              </div>
            ))}
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-3 text-label text-text-sub flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>새로 배운 {getCategoryName()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>이미 아는 {getCategoryName()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>복습 {getCategoryName()}</span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="text-label text-text-sub">Total</div>
            <div className="text-title font-bold text-text-main">
              {weekData.reduce((sum, d) => sum + d.value, 0)}
            </div>
          </div>
        </div>
      )}

      {/* 파이 차트 */}
      {!loading && pieData.length > 0 && pieData.some((d) => d.value > 0) && (
        <CategoryPieChart data={pieData} title={`${getCategoryName()} 분포`} />
      )}

      {loading && (
        <div className="bg-surface rounded-lg border border-divider p-6 text-center">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      )}
    </div>
  )
}

