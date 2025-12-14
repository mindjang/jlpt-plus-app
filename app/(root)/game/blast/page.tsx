'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BlastGameContainer } from '@/components/game/blast/BlastGameContainer'
import { ArrowLeft, Play, Zap, Trophy } from 'lucide-react'
import { Level } from '@/data'

type GameState = 'menu' | 'playing' | 'result'

export default function BlastGamePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedLevel, setSelectedLevel] = useState<Level>('N5')
  const [gameMode, setGameMode] = useState<'word' | 'kanji'>('word')

  const startGame = () => {
    setGameState('playing')
  }

  if (gameState === 'playing') {
    return (
      <BlastGameContainer
        level={selectedLevel}
        mode={gameMode}
        onExit={() => setGameState('menu')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="p-2 active:bg-white/10 rounded-full">
            <ArrowLeft className="text-yellow-400" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" fill="currentColor" />
            <h1 className="text-display-s font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent italic tracking-wider">
              WORD BLAST
            </h1>
            <Zap className="text-yellow-400" fill="currentColor" />
          </div>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
          {/* Title */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-block px-4 py-1 rounded-full border-2 border-yellow-500/50 bg-yellow-500/20 text-yellow-400 text-label font-mono mb-4"
            >
              💥 COMBO MASTER MODE
            </motion.div>
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]"
            >
              BLAST!
            </motion.h2>
            <p className="text-yellow-200">연속 정답으로 콤보를 쌓아보세요!</p>

            {/* Features */}
            <div className="flex gap-4 justify-center mt-6">
              <div className="flex items-center gap-2 text-sm text-pink-300">
                <Trophy size={16} />
                <span>콤보 시스템</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <Zap size={16} />
                <span>파워업</span>
              </div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-6">
            {/* Level Selector */}
            <div className="space-y-2">
              <label className="text-label font-semibold text-yellow-400 uppercase tracking-widest pl-1">Level Select</label>
              <div className="flex gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all relative overflow-hidden ${selectedLevel === lvl
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-105'
                        : 'bg-white/10 text-white/60 active:bg-white/20'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-widest pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'word'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                      : 'border-white/20 bg-white/5 text-white/50 active:border-white/40'
                    }`}
                >
                  <span className="text-2xl">あ</span>
                  <span className="font-bold text-sm">단어</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'kanji'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                      : 'border-white/20 bg-white/5 text-white/50 active:border-white/40'
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
            className="w-full max-w-xs py-5 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-lg font-black text-2xl text-white shadow-[0_0_40px_rgba(251,191,36,0.6)] flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
            <Play fill="currentColor" size={28} />
            START BLAST
          </motion.button>
        </main>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
