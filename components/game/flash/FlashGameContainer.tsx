'use client'

import React from 'react'
import { Level } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, RotateCcw, Zap, Clock, X } from 'lucide-react'
import { useFlashEngine } from './useFlashEngine'

interface FlashGameContainerProps {
  level: Level
  mode: 'word' | 'kanji'
  onExit: () => void
}

export function FlashGameContainer({ level, mode, onExit }: FlashGameContainerProps) {
  const {
    gameState,
    currentItem,
    options,
    score,
    streak,
    maxStreak,
    timeLeft,
    questionCount,
    totalQuestions,
    handleAnswer,
    togglePause,
    restartGame
  } = useFlashEngine(level, mode)

  const timePercent = (timeLeft / 3000) * 100

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden font-sans select-none">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500/20 to-transparent"
        />
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="text-cyan-400 font-bold">
            {questionCount}/{totalQuestions}
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full"
            >
              <Zap size={14} fill="currentColor" className="text-white" />
              <span className="text-white font-bold text-sm">{streak}</span>
            </motion.div>
          )}
        </div>

        <div className="font-mono text-3xl font-black text-cyan-400 italic drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
          {score.toString().padStart(5, '0')}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePause} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:bg-white/30">
            <Pause fill="currentColor" size={20} />
          </button>
          {gameState === 'playing' && (
            <button onClick={onExit} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:bg-white/30">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="absolute top-16 left-0 right-0 h-2 bg-white/10 z-20">
        <motion.div
          className={`h-full ${timePercent > 50 ? 'bg-cyan-500' : timePercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${timePercent}%` }}
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {/* Question Area */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-6">
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={currentItem.text}
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="inline-block px-4 py-2 bg-cyan-500/20 border-2 border-cyan-500 rounded-full text-cyan-400 text-xs font-bold mb-6">
                  {mode === 'word' ? '단어' : '한자'}
                </div>
                <motion.div
                  animate={{
                    scale: timePercent < 20 ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: timePercent < 20 ? Infinity : 0
                  }}
                  className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-4"
                >
                  {currentItem.text}
                </motion.div>
                {currentItem.subText && (
                  <div className="text-2xl text-cyan-300 opacity-80">
                    {currentItem.subText}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-24 z-30">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {options.map((option, idx) => (
              <motion.button
                key={`${currentItem?.text}-${idx}`}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(option)}
                className="px-4 py-5 bg-gradient-to-br from-blue-600/80 to-purple-600/80 backdrop-blur-md border border-white/30 rounded-lg font-bold text-white text-lg active:bg-cyan-500"
              >
                {option.split(',')[0]}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Game Over / Pause Overlay */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-blue-900 to-purple-900 p-8 rounded-lg border-2 border-cyan-500/50 shadow-2xl text-center max-w-sm w-full"
          >
            <h2 className="text-4xl font-black text-cyan-400 mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              {gameState === 'gameover' ? 'TIME\'S UP!' : 'PAUSED'}
            </h2>

            <div className="space-y-3 mb-6">
              <div className="bg-black/40 py-3 rounded-lg">
                <div className="text-sm text-cyan-300">FINAL SCORE</div>
                <div className="text-4xl font-mono text-white font-black">{score}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 py-3 rounded-lg">
                  <div className="text-xs text-yellow-300">MAX STREAK</div>
                  <div className="text-2xl font-bold text-white">{maxStreak}</div>
                </div>
                <div className="bg-black/40 py-3 rounded-lg">
                  <div className="text-xs text-purple-300">QUESTIONS</div>
                  <div className="text-2xl font-bold text-white">{questionCount}/{totalQuestions}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 active:opacity-80"
              >
                <RotateCcw size={20} />
                RESTART
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-white/10 active:bg-white/20 text-white rounded-lg font-bold"
              >
                EXIT MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
