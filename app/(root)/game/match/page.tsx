'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MatchGameContainer } from '@/components/game/match/MatchGameContainer'
import { ArrowLeft, Play, Brain, Clock } from 'lucide-react'
import { Level } from '@/data'

type GameState = 'menu' | 'playing' | 'result'

export default function MatchGamePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedLevel, setSelectedLevel] = useState<Level>('N5')
  const [gameMode, setGameMode] = useState<'word' | 'kanji'>('word')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  const startGame = () => {
    setGameState('playing')
  }

  if (gameState === 'playing') {
    return (
      <MatchGameContainer
        level={selectedLevel}
        mode={gameMode}
        difficulty={difficulty}
        onExit={() => setGameState('menu')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-20 bg-white/10 rounded-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-6 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="p-2 active:bg-white/10 rounded-full">
            <ArrowLeft className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="text-pink-300" size={28} />
            <h1 className="text-display-s font-bold text-white italic tracking-wider">
              WORD MATCH
            </h1>
            <Brain className="text-pink-300" size={28} />
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-8 pb-20">
          {/* Title */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="text-7xl mb-4"
            >
              🎴
            </motion.div>
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              카드 매칭
            </motion.h2>
            <p className="text-pink-200">같은 카드를 찾아 매칭하세요!</p>

            {/* Features */}
            <div className="flex gap-4 justify-center mt-6">
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <Brain size={16} />
                <span>기억력 게임</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-pink-300">
                <Clock size={16} />
                <span>시간 측정</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-6">
            {/* Difficulty Selector */}
            <div className="space-y-2">
              <label className="text-label font-semibold text-pink-300 uppercase tracking-widest pl-1">난이도</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-3 rounded-lg font-bold transition-all ${difficulty === diff
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 text-white active:bg-white/30'
                      }`}
                  >
                    {diff === 'easy' ? '쉬움 (4쌍)' : diff === 'medium' ? '보통 (6쌍)' : '어려움 (8쌍)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 uppercase tracking-widest pl-1">Level Select</label>
              <div className="flex gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${selectedLevel === lvl
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 text-white active:bg-white/30'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 uppercase tracking-widest pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'word'
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/30 bg-white/5 text-white/70 active:bg-white/10'
                    }`}
                >
                  <span className="text-2xl">あ</span>
                  <span className="font-bold text-sm">단어</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'kanji'
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/30 bg-white/5 text-white/70 active:bg-white/10'
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
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full max-w-xs py-5 bg-white text-purple-600 rounded-lg font-black text-2xl flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-pink-200 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            <Play fill="currentColor" size={28} />
            START GAME
          </motion.button>
        </main>
      </div>
    </div>
  )
}
