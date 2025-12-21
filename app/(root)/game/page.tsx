'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { motion } from 'framer-motion'

interface GameItem {
  id: number
  name: string
  description: string
  icon: string
  comingSoon?: boolean
  href?: string
  neonColor?: string
}

const games: GameItem[] = [
  {
    id: 2,
    name: 'WORD BLAST',
    description: '콤보로 폭발적인 점수를!',
    icon: '💥',
    comingSoon: false,
    href: '/game/blast',
    neonColor: '#FF00FF', // 네온 핑크
  },
  {
    id: 3,
    name: 'FLASH QUIZ',
    description: '3초 안에 빠르게 선택!',
    icon: '⚡',
    comingSoon: false,
    href: '/game/flash',
    neonColor: '#00FFFF', // 네온 시안
  },
  {
    id: 4,
    name: 'WORD MATCH',
    description: '카드를 뒤집어 매칭하세요',
    icon: '🎴',
    comingSoon: false,
    href: '/game/match',
    neonColor: '#00FF00', // 네온 그린
  },
  {
    id: 5,
    name: '게임 5',
    description: '준비 중입니다',
    icon: '🎪',
    comingSoon: true,
    neonColor: '#FFFF00', // 네온 옐로우
  },
  {
    id: 6,
    name: '게임 6',
    description: '준비 중입니다',
    icon: '🎨',
    comingSoon: true,
    neonColor: '#FF6600', // 네온 오렌지
  },
]

export default function GamePage() {
  const router = useRouter()

  return (
    <div className="w-full overflow-hidden min-h-screen relative scanline" style={{ background: '#0a0a0a' }}>
      {/* 배경 그리드 패턴 */}
      <div 
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* 배경 네온 효과 */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#FF00FF' }} />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#00FFFF' }} />
      <div className="fixed top-1/2 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#00FF00' }} />

      <div className="relative z-10">
        {/* 헤더 */}
        <AppBar 
          title="게임방" 
          onBack={() => router.push('/intro/game')}
          className="bg-transparent border-none backdrop-blur-sm [&_h1]:text-white [&_h1]:font-retro [&_h1]:text-subtitle [&_h1]:neon-text [&_button_span]:text-white [&_button]:text-white"
        />

        {/* 게임 선택 화면 */}
        <div className="flex flex-col gap-4 p-4 justify-center items-center min-h-screen pb-24 pt-20">
          {/* 타이틀 */}
          <div className="text-center mb-2">
            <h2 
              className="font-retro text-white text-title mb-1 neon-text"
              style={{ 
                color: '#00FFFF',
                textShadow: `
                  0 0 5px #00FFFF,
                  0 0 10px #00FFFF,
                  0 0 15px #00FFFF,
                  0 0 20px #00FFFF
                `
              }}
            >
              SELECT GAME
            </h2>
            <div className="h-0.5 w-24 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #00FFFF, transparent)' }} />
          </div>

          {games.map((game, index) => {
            const isActive = !game.comingSoon
            const neonColor = game.neonColor || '#00FFFF'
            
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20
                }}
                onClick={() => {
                  if (!game.comingSoon && game.href) {
                    router.push(game.href)
                  }
                }}
                disabled={game.comingSoon}
                className={`relative w-full p-5 rounded-lg border-2 transition-all duration-300 overflow-hidden group ${
                  game.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                }`}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)',
                  borderColor: game.comingSoon ? 'rgba(255, 255, 255, 0.2)' : neonColor,
                  boxShadow: game.comingSoon 
                    ? 'none'
                    : `
                      0 0 10px ${neonColor}40,
                      0 0 20px ${neonColor}30,
                      0 0 30px ${neonColor}20,
                      inset 0 0 20px ${neonColor}10
                    `,
                }}
                whileHover={!game.comingSoon ? {
                  boxShadow: `
                    0 0 15px ${neonColor}60,
                    0 0 30px ${neonColor}40,
                    0 0 45px ${neonColor}30,
                    inset 0 0 30px ${neonColor}15
                  `,
                } : {}}
              >
                {/* 내부 글로우 효과 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${neonColor}15 0%, transparent 70%)`,
                  }}
                />

                {/* 게임 아이콘 */}
                <div className="relative z-10 flex items-center gap-4">
                  <div 
                    className="text-4xl flex-shrink-0 filter drop-shadow-lg"
                    style={{
                      filter: `drop-shadow(0 0 8px ${neonColor}) drop-shadow(0 0 16px ${neonColor}80)`,
                    }}
                  >
                    {game.icon}
                  </div>

                  {/* 게임 정보 */}
                  <div className="flex-1 min-w-0 text-left">
                    <h3 
                      className="font-retro text-subtitle mb-2 truncate"
                      style={{ 
                        color: neonColor,
                        textShadow: `
                          0 0 5px ${neonColor},
                          0 0 10px ${neonColor}80,
                          0 0 15px ${neonColor}60
                        `,
                        fontWeight: 800,
                      }}
                    >
                      {game.name}
                    </h3>
                    {!game.comingSoon && (
                      <p 
                        className="text-label text-white/80 truncate font-retro"
                        style={{ 
                          fontSize: '0.75rem',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {game.description}
                      </p>
                    )}
                    {game.comingSoon && (
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-pixel text-label"
                          style={{ 
                            color: '#FFFF00',
                            textShadow: '0 0 5px #FFFF00',
                          }}
                        >
                          COMING SOON
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 화살표 (액티브 게임만) */}
                  {!game.comingSoon && (
                    <div 
                      className="flex-shrink-0"
                      style={{ 
                        color: neonColor,
                        filter: `drop-shadow(0 0 4px ${neonColor})`,
                      }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={3}
                        stroke="currentColor" 
                        className="w-6 h-6"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 코너 장식 */}
                <div 
                  className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2"
                  style={{ borderColor: neonColor }}
                />
                <div 
                  className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2"
                  style={{ borderColor: neonColor }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2"
                  style={{ borderColor: neonColor }}
                />
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2"
                  style={{ borderColor: neonColor }}
                />
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
