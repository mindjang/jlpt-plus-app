'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Level } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Pause, RotateCcw } from 'lucide-react'
import { useRainEngine } from './useRainEngine'

interface RainGameContainerProps {
  level: Level
  mode: 'word' | 'kanji'
  onExit: () => void
}

export function RainGameContainer({ level, mode, onExit }: RainGameContainerProps) {
  const {
    gameState,
    items,
    score,
    lives,
    options,
    handleOptionClick,
    togglePause,
    restartGame
  } = useRainEngine(level, mode)

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden font-sans select-none">
      {/* Game Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] [background-position:center] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none"></div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-slate-900">
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              size={20}
              className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700 fill-slate-800'} transition-colors`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {score.toString().padStart(5, '0')}
          </div>
          <button onClick={togglePause} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
            <Pause fill="currentColor" size={20} />
          </button>
        </div>
      </div>

      {/* Game Area - Items */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`absolute flex flex-col items-center transform -translate-x-1/2 will-change-transform ${item.isTarget ? 'z-20' : 'z-10'}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,  // Y 위치를 직접 top으로 제어
                transition: 'top 0.016s linear' // 60fps 부드러운 이동
              }}
            >
              <div className={`px-4 py-2 rounded-lg backdrop-blur-md border hover:scale-110 transition-transform text-center
                ${item.isTarget
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)]'
                  : 'bg-slate-800/80 border-slate-600 text-slate-400'}
                `}>
                <div className="text-xl font-bold leading-tight text-center">{item.text}</div>
                {item.subText && <div className="text-xs opacity-70 text-center">{item.subText}</div>}
              </div>
              {item.isTarget && (
                <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Controls (Options) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pt-20 z-30">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              className="px-2 py-3 bg-slate-800/80 border border-slate-700 rounded-lg font-bold text-slate-200 shadow-lg active:scale-95 active:bg-cyan-900/50 transition-all hover:border-cyan-500/50 hover:bg-slate-700"
            >
              {option.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Game Over / Pause Overlay */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-3xl font-black text-white mb-2">
              {gameState === 'gameover' ? 'GAME OVER' : 'PAUSED'}
            </h2>
            <div className="text-4xl font-mono text-cyan-400 mb-8 py-4 border-y border-slate-700">
              SCORE: {score}
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                RESTART
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold"
              >
                EXIT MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
