'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Clock, Target, Zap, Brain, Award } from 'lucide-react'
import { loadStats } from '@/lib/stats/storage'
import { calculateSummary } from '@/lib/stats/calculator'
import { UserStats } from '@/lib/stats/types'

type TabType = 'overview' | 'games' | 'levels'

export default function StatsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    const loadedStats = loadStats()
    setStats(loadedStats)
  }, [])

  if (!stats) {
    return (
      <div className="w-full overflow-hidden">
        <AppBar title="통계" showMenu />
        <div className="flex items-center justify-center h-screen">
          <p className="text-text-sub">로딩 중...</p>
        </div>
      </div>
    )
  }

  const summary = calculateSummary(stats)

  return (
    <div className="w-full overflow-hidden bg-page min-h-screen">
      <AppBar title="통계" showMenu />

      <div className="flex flex-col gap-6 p-4 pb-20">
        {/* 전체 요약 카드 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-primary to-primary-dark rounded-card shadow-soft p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={28} className="text-yellow-300" />
            <h2 className="text-title font-bold">전체 통계</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs opacity-80 mb-1">총 플레이</p>
              <p className="text-2xl font-black">{summary.totalGames}회</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">총 점수</p>
              <p className="text-2xl font-black">{summary.totalScore.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">평균 점수</p>
              <p className="text-2xl font-black">{summary.averageScore.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 mb-1">플레이 시간</p>
              <p className="text-2xl font-black">{summary.totalPlayTime}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">가장 좋아하는 게임</p>
                <p className="text-lg font-bold">{summary.favoriteGame}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">최고 레벨</p>
                <p className="text-lg font-bold">{summary.bestLevel}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 탭 */}
        <div className="flex gap-2 bg-surface rounded-card shadow-soft p-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 rounded-lg text-label font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-page'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-2 rounded-lg text-label font-medium transition-all ${
              activeTab === 'games'
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-page'
            }`}
          >
            게임별
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex-1 py-2 rounded-lg text-label font-medium transition-all ${
              activeTab === 'levels'
                ? 'bg-primary text-white'
                : 'text-text-sub hover:bg-page'
            }`}
          >
            레벨별
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'games' && <GamesTab stats={stats} />}
        {activeTab === 'levels' && <LevelsTab stats={stats} />}
      </div>
    </div>
  )
}

// 개요 탭
function OverviewTab({ stats }: { stats: UserStats }) {
  return (
    <div className="space-y-4">
      {/* 오늘 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-surface rounded-card shadow-soft p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={20} className="text-primary" />
          <h3 className="text-subtitle font-bold text-text-main">오늘</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">플레이</p>
            <p className="text-xl font-bold text-text-main">{stats.today.plays}회</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">점수</p>
            <p className="text-xl font-bold text-text-main">{stats.today.score.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">시간</p>
            <p className="text-xl font-bold text-text-main">{Math.floor(stats.today.time / 60)}분</p>
          </div>
        </div>
      </motion.div>

      {/* 이번 주 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-surface rounded-card shadow-soft p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={20} className="text-primary" />
          <h3 className="text-subtitle font-bold text-text-main">이번 주</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">플레이</p>
            <p className="text-xl font-bold text-text-main">{stats.thisWeek.plays}회</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">점수</p>
            <p className="text-xl font-bold text-text-main">{stats.thisWeek.score.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">시간</p>
            <p className="text-xl font-bold text-text-main">{Math.floor(stats.thisWeek.time / 60)}분</p>
          </div>
        </div>
      </motion.div>

      {/* 이번 달 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-surface rounded-card shadow-soft p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} className="text-primary" />
          <h3 className="text-subtitle font-bold text-text-main">이번 달</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">플레이</p>
            <p className="text-xl font-bold text-text-main">{stats.thisMonth.plays}회</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">점수</p>
            <p className="text-xl font-bold text-text-main">{stats.thisMonth.score.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-sub mb-1">시간</p>
            <p className="text-xl font-bold text-text-main">{Math.floor(stats.thisMonth.time / 60)}분</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// 게임별 탭
function GamesTab({ stats }: { stats: UserStats }) {
  const games = [
    {
      id: 'blast',
      name: 'WORD BLAST',
      icon: '💥',
      color: 'from-purple-500 to-pink-500',
      stats: stats.gameStats.blast,
    },
    {
      id: 'flash',
      name: 'FLASH QUIZ',
      icon: '⚡',
      color: 'from-blue-500 to-cyan-500',
      stats: stats.gameStats.flash,
    },
    {
      id: 'match',
      name: 'WORD MATCH',
      icon: '🎴',
      color: 'from-indigo-500 to-purple-500',
      stats: stats.gameStats.match,
    },
  ]

  return (
    <div className="space-y-4">
      {games.map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-surface rounded-card shadow-soft overflow-hidden"
        >
          <div className={`bg-gradient-to-r ${game.color} p-4 text-white`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{game.icon}</span>
              <div>
                <h3 className="text-subtitle font-bold">{game.name}</h3>
                <p className="text-xs opacity-80">{game.stats.plays}회 플레이</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-sub mb-1">최고 점수</p>
                <p className="text-xl font-bold text-text-main">{game.stats.bestScore.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-text-sub mb-1">평균 점수</p>
                <p className="text-xl font-bold text-text-main">{Math.round(game.stats.averageScore).toLocaleString()}</p>
              </div>

              {game.id === 'blast' && game.stats.bestCombo !== undefined && (
                <>
                  <div>
                    <p className="text-xs text-text-sub mb-1">최고 콤보</p>
                    <p className="text-xl font-bold text-primary">{game.stats.bestCombo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-sub mb-1">평균 콤보</p>
                    <p className="text-xl font-bold text-text-main">{Math.round(game.stats.averageCombo || 0)}</p>
                  </div>
                </>
              )}

              {game.id === 'flash' && (
                <>
                  <div>
                    <p className="text-xs text-text-sub mb-1">최고 연속 정답</p>
                    <p className="text-xl font-bold text-primary">{game.stats.bestStreak || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-sub mb-1">정답률</p>
                    <p className="text-xl font-bold text-text-main">{Math.round((game.stats.accuracy || 0) * 100)}%</p>
                  </div>
                </>
              )}

              {game.id === 'match' && (
                <>
                  <div>
                    <p className="text-xs text-text-sub mb-1">최단 시간</p>
                    <p className="text-xl font-bold text-primary">
                      {game.stats.bestTime === Infinity ? '-' : `${game.stats.bestTime}초`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-sub mb-1">최소 이동</p>
                    <p className="text-xl font-bold text-text-main">
                      {game.stats.bestMoves === Infinity ? '-' : `${game.stats.bestMoves}회`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// 레벨별 탭
function LevelsTab({ stats }: { stats: UserStats }) {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const

  return (
    <div className="space-y-4">
      {levels.map((level, index) => {
        const levelStats = stats.levelStats[level]
        return (
          <motion.div
            key={level}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface rounded-card shadow-soft p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-subtitle font-bold text-text-main">{level}</h3>
              <span className="text-xs text-text-sub">{levelStats.plays}회 플레이</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-text-sub mb-1">최고 점수</p>
                <p className="text-xl font-bold text-primary">{levelStats.bestScore.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-sub mb-1">평균 점수</p>
                <p className="text-xl font-bold text-text-main">{Math.round(levelStats.averageScore).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-sub mb-1">총 점수</p>
                <p className="text-xl font-bold text-text-main">{levelStats.totalScore.toLocaleString()}</p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-sub mb-1">
                <span>플레이 비율</span>
                <span>{Math.round((levelStats.plays / stats.totalPlays) * 100)}%</span>
              </div>
              <div className="h-2 bg-page rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(levelStats.plays / stats.totalPlays) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
