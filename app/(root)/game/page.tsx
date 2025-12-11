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
  href?: string
}

const games: GameItem[] = [
  {
    id: 1,
    name: 'NEON RAIN',
    description: '떨어지는 단어를 맞춰보세요',
    icon: '🌧️',
    comingSoon: false,
    href: '/game/rain',
  },
  {
    id: 2,
    name: 'WORD BLAST',
    description: '콤보로 폭발적인 점수를!',
    icon: '💥',
    comingSoon: false,
    href: '/game/blast',
  },
  {
    id: 3,
    name: 'FLASH QUIZ',
    description: '3초 안에 빠르게 선택!',
    icon: '⚡',
    comingSoon: false,
    href: '/game/flash',
  },
  {
    id: 4,
    name: 'WORD MATCH',
    description: '카드를 뒤집어 매칭하세요',
    icon: '🎴',
    comingSoon: false,
    href: '/game/match',
  },
  {
    id: 5,
    name: '게임 5',
    description: '준비 중입니다',
    icon: '🎪',
    comingSoon: true,
  },
  {
    id: 6,
    name: '게임 6',
    description: '준비 중입니다',
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
                if (!game.comingSoon && (game as any).href) {
                  router.push((game as any).href)
                }
              }}
              disabled={game.comingSoon}
              className={`bg-surface rounded-card shadow-soft p-6 text-center button-press transition-all ${game.comingSoon
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
