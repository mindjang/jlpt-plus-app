'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, BookOpen, Settings, Ticket, BarChart2, TrendingUp, Clock, Award } from 'lucide-react'
import { getAllUsers, getAllGiftCodes } from '@/lib/firebase/firestore'
import { levelData } from '@/data'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { getDbInstance, formatDateKey } from '@/lib/firebase/firestore/utils'

interface DashboardStats {
  totalUsers: number
  activeUsers: number // 최근 7일 활동
  membershipUsers: number
  totalContent: number
  activeCodes: number
  todayActiveUsers: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    membershipUsers: 0,
    totalContent: 0,
    activeCodes: 0,
    todayActiveUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const dbInstance = getDbInstance()

      // 기본 데이터 로드 (병렬 처리)
      const [users, codes] = await Promise.all([
        getAllUsers(),
        getAllGiftCodes(),
      ])

      // 활성 코드 계산
      const activeCodes = codes.filter((c) => {
        const uses = c.data.remainingUses
        return uses === null || uses === undefined || uses > 0
      }).length

      // 총 콘텐츠 계산
      const totalContent = Object.values(levelData).reduce(
        (acc, curr) => acc + curr.words + curr.kanji,
        0
      )

      // 성능 최적화: 샘플링 및 배치 처리
      // 사용자 수가 많을 경우 샘플링하여 통계 계산
      const sampleSize = Math.min(users.length, 500) // 최대 500명만 확인
      const sampledUsers = users.slice(0, sampleSize)

      // 날짜 키 생성
      const todayKey = formatDateKey()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoKey = formatDateKey(sevenDaysAgo)

      // 배치로 멤버십 및 활동 확인 (병렬 처리)
      const statsPromises = sampledUsers.map(async (user) => {
        if (!user.uid) return { hasMembership: false, isActive: false, isTodayActive: false }

        try {
          // 멤버십 확인
          const membershipRef = collection(dbInstance, 'users', user.uid, 'membership')
          const membershipSnap = await getDocs(membershipRef)
          const hasMembership = !membershipSnap.empty && membershipSnap.docs.some((doc) => {
            const data = doc.data()
            return data.expiresAt && data.expiresAt > Date.now()
          })

          // 활동 확인
          const dailyActivityRef = collection(dbInstance, 'users', user.uid, 'dailyActivity')
          const activityQuery = query(
            dailyActivityRef,
            where('dateKey', '>=', sevenDaysAgoKey),
            where('dateKey', '<=', todayKey),
            limit(1)
          )
          const activitySnap = await getDocs(activityQuery)
          const isActive = !activitySnap.empty

          // 오늘 활동 확인
          const todayActivityQuery = query(
            dailyActivityRef,
            where('dateKey', '==', todayKey),
            limit(1)
          )
          const todayActivitySnap = await getDocs(todayActivityQuery)
          const isTodayActive = !todayActivitySnap.empty

          return { hasMembership, isActive, isTodayActive }
        } catch (e) {
          return { hasMembership: false, isActive: false, isTodayActive: false }
        }
      })

      // 모든 통계 병렬 처리
      const statsResults = await Promise.all(statsPromises)

      // 통계 집계
      let membershipUsers = 0
      let activeUsers = 0
      let todayActiveUsers = 0

      statsResults.forEach((result) => {
        if (result.hasMembership) membershipUsers++
        if (result.isActive) activeUsers++
        if (result.isTodayActive) todayActiveUsers++
      })

      // 샘플링된 경우 비율로 추정
      if (users.length > sampleSize) {
        const ratio = users.length / sampleSize
        membershipUsers = Math.round(membershipUsers * ratio)
        activeUsers = Math.round(activeUsers * ratio)
        todayActiveUsers = Math.round(todayActiveUsers * ratio)
      }

      setStats({
        totalUsers: users.length,
        activeUsers,
        membershipUsers,
        totalContent,
        activeCodes,
        todayActiveUsers,
      })
    } catch (error) {
      console.error('대시보드 통계 로드 실패:', error)
      setError('통계를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      id: 'users',
      title: '사용자 관리',
      description: '사용자 목록 및 권한',
      icon: Users,
      path: '/admin/users',
    },
    {
      id: 'content',
      title: '콘텐츠 관리',
      description: '단어 및 한자 목록 관리',
      icon: BookOpen,
      path: '/admin/content',
    },
    {
      id: 'settings',
      title: '설정',
      description: '학습 콘텐츠 활성화',
      icon: Settings,
      path: '/admin/settings',
    },
    {
      id: 'codes',
      title: '쿠폰 코드',
      description: '코드 생성 및 관리',
      icon: Ticket,
      path: '/admin/codes',
    },
    {
      id: 'stats',
      title: '통계 분석',
      description: '학습 통계 및 분석',
      icon: BarChart2,
      path: '/admin/stats',
    },
  ]

  if (loading) {
    return (
      <>
        <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-title font-semibold text-text-main">대시보드</h1>
          <div className="text-label text-text-sub hidden md:block">관리자 대시보드</div>
        </div>
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-6">
            <div className="text-center py-12 text-body text-text-sub">로딩 중...</div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-title font-semibold text-text-main">대시보드</h1>
          <div className="text-label text-text-sub hidden md:block">관리자 대시보드</div>
        </div>
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-6">
            <div className="bg-red-50 text-red-800 p-4 rounded-lg text-body">{error}</div>
            <button
              onClick={loadDashboardStats}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* 상단 헤더 */}
      <div className="h-14 border-b border-divider bg-surface flex items-center justify-between px-6 sticky top-0 z-30">
        <h1 className="text-title font-semibold text-text-main">대시보드</h1>
        <div className="text-label text-text-sub hidden md:block">관리자 대시보드</div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">총 사용자</div>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">전체 가입자</div>
            </div>

            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">활성 사용자</div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.activeUsers.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">최근 7일 활동</div>
            </div>

            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">멤버십 사용자</div>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.membershipUsers.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">유료 구독자</div>
            </div>

            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">오늘 학습</div>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.todayActiveUsers.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">오늘 활동한 사용자</div>
            </div>

            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">총 학습 콘텐츠</div>
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.totalContent.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">단어 + 한자</div>
            </div>

            <div className="bg-surface rounded-lg border border-divider p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-label text-text-sub">활성 쿠폰</div>
                <Ticket className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-display-s font-bold text-text-main">{stats.activeCodes.toLocaleString()}</div>
              <div className="text-xs text-text-sub mt-1">사용 가능한 코드</div>
            </div>
          </div>

          {/* 빠른 액세스 */}
          <div>
            <h2 className="text-subtitle font-semibold text-text-main mb-4">빠른 액세스</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => router.push(section.path)}
                    className="bg-surface rounded-lg border border-divider p-4 hover:border-primary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="text-primary" size={20} />
                      </div>
                      <div className="text-subtitle font-semibold text-text-main">{section.title}</div>
                    </div>
                    <div className="text-label text-text-sub">{section.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
