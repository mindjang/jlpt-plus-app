'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="w-full overflow-hidden bg-page min-h-screen">
      <AppBar title="게임존" />

      <div className="flex flex-col gap-2 p-4 pb-20">
        {games.map((game, index) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              if (!game.comingSoon && (game as any).href) {
                router.push((game as any).href)
              }
            }}
            disabled={game.comingSoon}
            className={`w-full p-4 bg-surface rounded-lg border border-divider flex items-center justify-between active:bg-gray-50 transition-all ${
              game.comingSoon
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* 게임 아이콘 */}
              <div className="text-2xl flex-shrink-0">{game.icon}</div>

              {/* 게임 정보 */}
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-body font-semibold text-text-main mb-0.5">
                  {game.name}
                </h3>
                {!game.comingSoon && (
                  <p className="text-label text-text-sub truncate">
                    {game.description}
                  </p>
                )}
                {game.comingSoon && (
                  <p className="text-label text-text-sub">준비 중</p>
                )}
              </div>
            </div>

            {/* 화살표 */}
            {!game.comingSoon && (
              <ArrowRight size={18} className="text-text-sub flex-shrink-0" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
