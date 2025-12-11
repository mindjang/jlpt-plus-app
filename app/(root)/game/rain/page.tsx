'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RainGameContainer } from '@/components/game/rain/RainGameContainer'
import { ArrowLeft, Play } from 'lucide-react'
import { Level } from '@/data'

type GameState = 'menu' | 'playing' | 'result'

export default function RainGamePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedLevel, setSelectedLevel] = useState<Level>('N5')
  const [gameMode, setGameMode] = useState<'word' | 'kanji'>('word')

  const startGame = () => {
    setGameState('playing')
  }

  if (gameState === 'playing') {
    return (
      <RainGameContainer
        level={selectedLevel}
        mode={gameMode}
        onExit={() => setGameState('menu')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

      {/* Neon Glow Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-cyan-600 rounded-full blur-[120px] opacity-20"></div>

      <div className="relative z-10 p-6 flex flex-col h-screen">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="text-cyan-400" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent italic tracking-wider">
            NEON RAIN
          </h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
          {/* Title */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-block px-4 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-4"
            >
              ARCADE MODE
            </motion.div>
            <motion.h2
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            >
              WORD DROP
            </motion.h2>
            <p className="text-slate-400">단어가 떨어지기 전에 뜻을 맞추세요!</p>
          </div>

          {/* Selection Controls */}
          <div className="w-full max-w-sm space-y-6">
            {/* Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Level Select</label>
              <div className="flex gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all relative overflow-hidden ${selectedLevel === lvl
                        ? 'bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Content Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGameMode('word')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'word'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'
                    }`}
                >
                  <span className="text-2xl">あ</span>
                  <span className="font-bold text-sm">단어 (Words)</span>
                </button>
                <button
                  onClick={() => setGameMode('kanji')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${gameMode === 'kanji'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'
                    }`}
                >
                  <span className="text-2xl">字</span>
                  <span className="font-bold text-sm">한자 (Kanji)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-black text-xl text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Play fill="currentColor" />
            GAME START
          </motion.button>
        </main>
      </div>
    </div>
  )
}
