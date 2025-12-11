'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'

interface GameItem {
  id: number
  name: string
  description: string
  icon: string
  comingSoon?: boolean
}

const games: GameItem[] = [
  {
    id: 1,
    name: '게임 1',
    description: '게임 설명이 들어갑니다',
    icon: '🎮',
    comingSoon: true,
  },
  {
    id: 2,
    name: '게임 2',
    description: '게임 설명이 들어갑니다',
    icon: '🎯',
    comingSoon: true,
  },
  {
    id: 3,
    name: '게임 3',
    description: '게임 설명이 들어갑니다',
    icon: '🎲',
    comingSoon: true,
  },
  {
    id: 4,
    name: '게임 4',
    description: '게임 설명이 들어갑니다',
    icon: '🧩',
    comingSoon: true,
  },
  {
    id: 5,
    name: '게임 5',
    description: '게임 설명이 들어갑니다',
    icon: '🎪',
    comingSoon: true,
  },
  {
    id: 6,
    name: '게임 6',
    description: '게임 설명이 들어갑니다',
    icon: '🎨',
    comingSoon: true,
  },
]

export default function GamePage() {
  const router = useRouter()

  return (
    <div className="w-full overflow-hidden">
      <AppBar title="게임존" showMenu />

      <div className="flex flex-col gap-6 p-4 pb-20">
        <div className="text-center mb-2">
          <p className="text-body text-text-sub">
            재미있는 게임으로 일본어를 배워보세요!
          </p>
        </div>

        {/* 게임 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                // 추후 게임 페이지로 이동
                if (!game.comingSoon) {
                  // router.push(`/game/${game.id}`)
                }
              }}
              disabled={game.comingSoon}
              className={`bg-surface rounded-card shadow-soft p-6 text-center button-press transition-all ${
                game.comingSoon
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-md hover:scale-105'
              }`}
            >
              {/* 게임 아이콘 */}
              <div className="text-5xl mb-3">{game.icon}</div>

              {/* 게임 제목 */}
              <h3 className="text-subtitle font-semibold text-text-main mb-2">
                {game.name}
              </h3>

              {/* 게임 설명 */}
              <p className="text-label text-text-sub mb-3">
                {game.description}
              </p>

              {/* 준비중 배지 */}
              {game.comingSoon && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
                  준비중
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
