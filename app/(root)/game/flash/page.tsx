'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FlashGameContainer } from '@/components/game/flash/FlashGameContainer'
import { ArrowLeft, Play, Zap, Clock } from 'lucide-react'
import { Level } from '@/data'

type GameState = 'menu' | 'playing' | 'result'

export default function FlashGamePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedLevel, setSelectedLevel] = useState<Level>('N5')
  const [gameMode, setGameMode] = useState<'word' | 'kanji'>('word')

  const startGame = () => {
    setGameState('playing')
  }

  if (gameState === 'playing') {
    return (
      <FlashGameContainer
        level={selectedLevel}
        mode={gameMode}
        onExit={() => setGameState('menu')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white overflow-hidden relative">
      {/* Lightning Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 4,
            delay: 1
          }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20"
        />
      </div>

      <div className="relative z-10 p-4 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 active:bg-white/10 rounded-lg">
            <ArrowLeft className="text-cyan-400" size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400 animate-pulse" fill="currentColor" size={20} />
            <h1 className="text-title font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              FLASH QUIZ
            </h1>
            <Zap className="text-yellow-400 animate-pulse" fill="currentColor" size={20} />
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-6 pb-20">
          {/* Title */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="inline-block px-3 py-1 rounded-full border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 text-label font-medium mb-3"
            >
              ⚡ SPEED MODE
            </motion.div>
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-title font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            >
              3초의 기적
            </motion.h2>
            <p className="text-body text-cyan-200">빠르게 생각하고 빠르게 선택하세요!</p>

            {/* Features */}
            <div className="flex gap-3 justify-center mt-4">
              <div className="flex items-center gap-1.5 text-label text-yellow-300">
                <Clock size={14} />
                <span>3초 제한</span>
              </div>
              <div className="flex items-center gap-1.5 text-label text-purple-300">
                <Zap size={14} />
                <span>연속 보너스</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-4">
            {/* Level Selector */}
            <div className="space-y-1.5">
              <label className="text-label font-semibold text-cyan-400 uppercase tracking-wide pl-1">Level Select</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-2 rounded-lg font-semibold transition-all text-body ${selectedLevel === lvl
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                        : 'bg-white/10 text-white/60 active:bg-white/20'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-label font-semibold text-cyan-400 uppercase tracking-wide pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${gameMode === 'word'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-white/20 bg-white/5 text-white/50 active:border-white/40'
                    }`}
                >
                  <span className="text-xl">あ</span>
                  <span className="font-semibold text-body">단어</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${gameMode === 'kanji'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-white/20 bg-white/5 text-white/50 active:border-white/40'
                    }`}
                >
                  <span className="text-xl">字</span>
                  <span className="font-semibold text-body">한자</span>
                </button>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg font-bold text-body text-white shadow-sm flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            <Zap fill="currentColor" size={20} />
            START FLASH
          </motion.button>
        </main>
      </div>
    </div>
  )
}
