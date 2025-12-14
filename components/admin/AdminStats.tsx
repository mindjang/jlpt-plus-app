'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getAllUsers, getAllGiftCodes } from '@/lib/firebase/firestore'
import { levelData, Level } from '@/data'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { getDbInstance, formatDateKey } from '@/lib/firebase/firestore/utils'
import { Calendar } from 'lucide-react'

interface LevelStats {
  level: Level
  totalUsers: number
  activeUsers: number
  totalCards: number
}

interface DailyActivity {
  date: string
  activeUsers: number
  studyMinutes: number
  cardsReviewed: number
}

interface MembershipStats {
  total: number
  active: number
  expired: number
  byType: {
    gift: number
    monthly: number
    yearly: number
  }
}

type DateRange = '7' | '30' | '90'

export function AdminStats() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('30')
  const [levelStats, setLevelStats] = useState<LevelStats[]>([])
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([])
  const [membershipStats, setMembershipStats] = useState<MembershipStats>({
    total: 0,
    active: 0,
    expired: 0,
    byType: { gift: 0, monthly: 0, yearly: 0 },
  })
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalCodes, setTotalCodes] = useState(0)

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const dbInstance = getDbInstance()

      // 기본 데이터
      const [users, codes] = await Promise.all([
        getAllUsers(),
        getAllGiftCodes(),
      ])

      setTotalUsers(users.length)
      setTotalCodes(codes.length)

      // 성능 최적화: 샘플링
      const sampleSize = Math.min(users.length, 300)
      const sampledUsers = users.slice(0, sampleSize)

      // 레벨별 통계 (최적화)
      const levelStatsData: LevelStats[] = []
      const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

      // 레벨별 통계를 병렬로 처리
      const levelStatsPromises = levels.map(async (level) => {
        let totalCards = 0
        let activeUsers = 0

        // 레벨별 콘텐츠 수
        const levelInfo = levelData[level]
        if (levelInfo) {
          totalCards = levelInfo.words + levelInfo.kanji
        }

        // 샘플링된 사용자만 확인
        const userChecks = sampledUsers.slice(0, 100).map(async (user) => {
          if (!user.uid) return false
          try {
            const cardsRef = collection(dbInstance, 'users', user.uid, 'cards')
            const levelQuery = query(cardsRef, where('level', '==', level), limit(1))
            const cardsSnap = await getDocs(levelQuery)
            return !cardsSnap.empty
          } catch (e) {
            return false
          }
        })

        const results = await Promise.all(userChecks)
        activeUsers = results.filter(Boolean).length

        // 샘플링 비율로 추정
        if (users.length > 100) {
          const ratio = users.length / 100
          activeUsers = Math.round(activeUsers * ratio)
        }

        return { level, totalUsers: users.length, activeUsers, totalCards }
      })

      const levelStatsResults = await Promise.all(levelStatsPromises)
      setLevelStats(levelStatsResults)

      // 날짜 범위에 따른 활동 통계
      const days = parseInt(dateRange)
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - days)

      const activityData: DailyActivity[] = []
      const activityPromises: Promise<void>[] = []

      // 날짜별로 배치 처리 (최대 30일만 상세 확인)
      const maxDays = Math.min(days, 30)
      for (let i = maxDays - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = formatDateKey(date)

        // 각 날짜별로 샘플링된 사용자만 확인
        const dayPromise = (async () => {
          let activeUsers = 0
          let totalStudyMinutes = 0
          let totalCardsReviewed = 0

          const userChecks = sampledUsers.slice(0, 50).map(async (user) => {
            if (!user.uid) return null
            try {
              const activityRef = collection(dbInstance, 'users', user.uid, 'dailyActivity')
              const activityQuery = query(activityRef, where('dateKey', '==', dateKey), limit(1))
              const activitySnap = await getDocs(activityQuery)
              if (!activitySnap.empty) {
                const activity = activitySnap.docs[0].data()
                return {
                  active: true,
                  studyMinutes: activity.studyMinutes || 0,
                  cardsReviewed: activity.cardsReviewed || 0,
                }
              }
            } catch (e) {
              // 무시
            }
            return null
          })

          const results = await Promise.all(userChecks)
          results.forEach((result) => {
            if (result) {
              activeUsers++
              totalStudyMinutes += result.studyMinutes
              totalCardsReviewed += result.cardsReviewed
            }
          })

          // 샘플링 비율로 추정
          if (users.length > 50) {
            const ratio = users.length / 50
            activeUsers = Math.round(activeUsers * ratio)
            totalStudyMinutes = Math.round(totalStudyMinutes * ratio)
            totalCardsReviewed = Math.round(totalCardsReviewed * ratio)
          }

          activityData.push({
            date: dateKey,
            activeUsers,
            studyMinutes: totalStudyMinutes,
            cardsReviewed: totalCardsReviewed,
          })
        })()

        activityPromises.push(dayPromise)
      }

      // 날짜별 활동을 병렬로 처리하되, 배치로 나눠서 처리
      const batchSize = 10
      for (let i = 0; i < activityPromises.length; i += batchSize) {
        const batch = activityPromises.slice(i, i + batchSize)
        await Promise.all(batch)
      }

      // 날짜순 정렬
      activityData.sort((a, b) => a.date.localeCompare(b.date))
      setDailyActivity(activityData)

      // 멤버십 통계 (샘플링)
      let totalMemberships = 0
      let activeMemberships = 0
      let expiredMemberships = 0
      const byType = { gift: 0, monthly: 0, yearly: 0 }

      const membershipChecks = sampledUsers.map(async (user) => {
        if (!user.uid) return null
        try {
          const membershipRef = collection(dbInstance, 'users', user.uid, 'membership')
          const membershipSnap = await getDocs(membershipRef)
          if (!membershipSnap.empty) {
            const membership = membershipSnap.docs[0].data()
            return {
              hasMembership: true,
              isActive: membership.expiresAt && membership.expiresAt > Date.now(),
              type: membership.type || 'gift',
            }
          }
        } catch (e) {
          // 무시
        }
        return null
      })

      const membershipResults = await Promise.all(membershipChecks)
      membershipResults.forEach((result) => {
        if (result && result.hasMembership) {
          totalMemberships++
          if (result.isActive) {
            activeMemberships++
            byType[result.type as keyof typeof byType] = (byType[result.type as keyof typeof byType] || 0) + 1
          } else {
            expiredMemberships++
          }
        }
      })

      // 샘플링 비율로 추정
      if (users.length > sampleSize) {
        const ratio = users.length / sampleSize
        totalMemberships = Math.round(totalMemberships * ratio)
        activeMemberships = Math.round(activeMemberships * ratio)
        expiredMemberships = Math.round(expiredMemberships * ratio)
        Object.keys(byType).forEach((key) => {
          byType[key as keyof typeof byType] = Math.round(byType[key as keyof typeof byType] * ratio)
        })
      }

      setMembershipStats({
        total: totalMemberships,
        active: activeMemberships,
        expired: expiredMemberships,
        byType,
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
      setError('통계를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const maxDailyActive = useMemo(() => Math.max(...dailyActivity.map((d) => d.activeUsers), 1), [dailyActivity])
  const maxCardsReviewed = useMemo(() => Math.max(...dailyActivity.map((d) => d.cardsReviewed), 1), [dailyActivity])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg text-body">{error}</div>
        <button onClick={loadStats} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          다시 시도
        </button>
      </div>
    )
  }

  const totalContent = Object.values(levelData).reduce((acc, curr) => acc + curr.words + curr.kanji, 0)

  return (
    <div className="space-y-6">
      {/* 날짜 범위 선택 */}
      <div className="bg-surface rounded-lg border border-divider p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-text-sub" />
            <span className="text-body font-semibold text-text-main">날짜 범위</span>
          </div>
          <div className="flex gap-2">
            {(['7', '30', '90'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-body font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-white'
                    : 'bg-page text-text-main hover:bg-gray-100'
                }`}
              >
                최근 {range}일
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">총 사용자</div>
          <div className="text-display-s font-bold text-text-main">{totalUsers.toLocaleString()}명</div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">활성 멤버십</div>
          <div className="text-display-s font-bold text-text-main">{membershipStats.active.toLocaleString()}개</div>
          <div className="text-xs text-green-600 mt-1">전체: {membershipStats.total}개</div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">총 학습 콘텐츠</div>
          <div className="text-display-s font-bold text-text-main">{totalContent.toLocaleString()}개</div>
          <div className="text-label text-text-sub mt-1">단어 + 한자</div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-divider">
          <div className="text-label text-text-sub mb-1">발급된 쿠폰</div>
          <div className="text-display-s font-bold text-text-main">{totalCodes.toLocaleString()}개</div>
        </div>
      </div>

      {/* 레벨별 학습 통계 */}
      <div className="bg-surface rounded-lg border border-divider p-6">
        <h3 className="text-subtitle font-semibold text-text-main mb-4">레벨별 학습 통계</h3>
        <div className="space-y-4">
          {levelStats.map((stat) => (
            <div key={stat.level} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-text-main">{stat.level}</span>
                <span className="text-label text-text-sub">
                  활성 사용자: {stat.activeUsers}명 / 콘텐츠: {stat.totalCards}개
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((stat.activeUsers / stat.totalUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 추이 */}
      <div className="bg-surface rounded-lg border border-divider p-6">
        <h3 className="text-subtitle font-semibold text-text-main mb-4">최근 {dateRange}일 활동 추이</h3>
        {dailyActivity.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {dailyActivity.map((day, index) => {
                const date = new Date(
                  parseInt(day.date.substring(0, 4)),
                  parseInt(day.date.substring(4, 6)) - 1,
                  parseInt(day.date.substring(6, 8))
                )
                const dayLabel = date.getDate().toString()
                const intensity = day.activeUsers / maxDailyActive

                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded"
                      style={{
                        height: '40px',
                        backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`,
                      }}
                      title={`${day.date}: ${day.activeUsers}명`}
                    />
                    <span className="text-xs text-text-sub">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-text-sub">
              <span>활성 사용자 수</span>
              <span>최대: {maxDailyActive}명</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-sub">활동 데이터가 없습니다.</div>
        )}
      </div>

      {/* 멤버십 통계 */}
      <div className="bg-surface rounded-lg border border-divider p-6">
        <h3 className="text-subtitle font-semibold text-text-main mb-4">멤버십 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-label text-text-sub mb-1">전체</div>
            <div className="text-title font-semibold text-text-main">{membershipStats.total}</div>
          </div>
          <div>
            <div className="text-label text-text-sub mb-1">활성</div>
            <div className="text-title font-semibold text-green-600">{membershipStats.active}</div>
          </div>
          <div>
            <div className="text-label text-text-sub mb-1">만료</div>
            <div className="text-title font-semibold text-red-600">{membershipStats.expired}</div>
          </div>
          <div>
            <div className="text-label text-text-sub mb-1">구독률</div>
            <div className="text-title font-semibold text-text-main">
              {totalUsers > 0 ? ((membershipStats.active / totalUsers) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-divider">
          <div className="text-label text-text-sub mb-2">타입별 분포</div>
          <div className="flex gap-4">
            <div>
              <span className="text-label text-text-sub">기프트: </span>
              <span className="text-body font-semibold text-text-main">{membershipStats.byType.gift}</span>
            </div>
            <div>
              <span className="text-label text-text-sub">월간: </span>
              <span className="text-body font-semibold text-text-main">{membershipStats.byType.monthly}</span>
            </div>
            <div>
              <span className="text-label text-text-sub">연간: </span>
              <span className="text-body font-semibold text-text-main">{membershipStats.byType.yearly}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
