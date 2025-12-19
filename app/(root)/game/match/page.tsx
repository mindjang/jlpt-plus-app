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

      <div className="relative z-10 p-4 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 active:bg-white/10 rounded-lg">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="text-pink-300" size={20} />
            <h1 className="text-title font-bold text-white">
              WORD MATCH
            </h1>
            <Brain className="text-pink-300" size={20} />
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
              className="text-4xl mb-3"
            >
              🎴
            </motion.div>
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-title font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            >
              카드 매칭
            </motion.h2>
            <p className="text-body text-pink-200">같은 카드를 찾아 매칭하세요!</p>

            {/* Features */}
            <div className="flex gap-3 justify-center mt-4">
              <div className="flex items-center gap-1.5 text-label text-yellow-300">
                <Brain size={14} />
                <span>기억력 게임</span>
              </div>
              <div className="flex items-center gap-1.5 text-label text-pink-300">
                <Clock size={14} />
                <span>시간 측정</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-4">
            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="text-label font-semibold text-pink-300 uppercase tracking-wide pl-1">난이도</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-lg font-semibold transition-all text-body ${difficulty === diff
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 text-white active:bg-white/30'
                      }`}
                  >
                    {diff === 'easy' ? '쉬움' : diff === 'medium' ? '보통' : '어려움'}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selector */}
            <div className="space-y-1.5">
              <label className="text-label font-semibold text-pink-300 uppercase tracking-wide pl-1">Level Select</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-2 rounded-lg font-semibold transition-all text-body ${selectedLevel === lvl
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
            <div className="space-y-1.5">
              <label className="text-label font-semibold text-pink-300 uppercase tracking-wide pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${gameMode === 'word'
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/30 bg-white/5 text-white/70 active:bg-white/10'
                    }`}
                >
                  <span className="text-xl">あ</span>
                  <span className="font-semibold text-body">단어</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1.5 ${gameMode === 'kanji'
                      ? 'border-white bg-white/20 text-white'
                      : 'border-white/30 bg-white/5 text-white/70 active:bg-white/10'
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
            className="w-full max-w-xs py-4 bg-white text-purple-600 rounded-lg font-bold text-body flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-pink-200 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            <Play fill="currentColor" size={20} />
            START GAME
          </motion.button>
        </main>
      </div>
    </div>
  )
}
