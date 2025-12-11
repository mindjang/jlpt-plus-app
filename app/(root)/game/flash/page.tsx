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

      <div className="relative z-10 p-6 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="text-cyan-400" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400 animate-pulse" fill="currentColor" size={28} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent italic tracking-wider">
              FLASH QUIZ
            </h1>
            <Zap className="text-yellow-400 animate-pulse" fill="currentColor" size={28} />
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
          {/* Title */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="inline-block px-4 py-1 rounded-full border-2 border-cyan-500/50 bg-cyan-500/20 text-cyan-400 text-xs font-mono mb-4"
            >
              ⚡ SPEED MODE
            </motion.div>
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            >
              3초의 기적
            </motion.h2>
            <p className="text-cyan-200">빠르게 생각하고 빠르게 선택하세요!</p>

            {/* Features */}
            <div className="flex gap-4 justify-center mt-6">
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <Clock size={16} />
                <span>3초 제한</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <Zap size={16} />
                <span>연속 보너스</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-6">
            {/* Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest pl-1">Level Select</label>
              <div className="flex gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedLevel === lvl
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_25px_rgba(34,211,238,0.6)] scale-105'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'word'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                      : 'border-white/20 bg-white/5 text-white/50 hover:border-white/40'
                    }`}
                >
                  <span className="text-2xl">あ</span>
                  <span className="font-bold text-sm">단어</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'kanji'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                      : 'border-white/20 bg-white/5 text-white/50 hover:border-white/40'
                    }`}
                >
                  <span className="text-2xl">字</span>
                  <span className="font-bold text-sm">한자</span>
                </button>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full max-w-xs py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl font-black text-2xl text-white shadow-[0_0_40px_rgba(34,211,238,0.6)] flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            <Zap fill="currentColor" size={28} />
            START FLASH
          </motion.button>
        </main>
      </div>
    </div>
  )
}
