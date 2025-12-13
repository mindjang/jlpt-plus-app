'use client'

import React from 'react'
import { Level } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Pause, RotateCcw, Zap, Bomb, X } from 'lucide-react'
import { useBlastEngine } from './useBlastEngine'

interface BlastGameContainerProps {
  level: Level
  mode: 'word' | 'kanji'
  onExit: () => void
}

export function BlastGameContainer({ level, mode, onExit }: BlastGameContainerProps) {
  const {
    gameState,
    items,
    score,
    lives,
    combo,
    maxCombo,
    options,
    powerUp,
    particles,
    handleOptionClick,
    togglePause,
    restartGame
  } = useBlastEngine(level, mode)

  // 콤보 배수 계산
  const comboMultiplier = Math.min(Math.floor(combo / 5) + 1, 5)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 overflow-hidden font-sans select-none">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000"></div>
      </div>

      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              size={20}
              className={`${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-700 fill-gray-800'} transition-all duration-300`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="font-mono text-3xl font-black text-yellow-400 italic drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
            {score.toString().padStart(6, '0')}
          </div>
          {combo > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full mt-1"
            >
              {combo} COMBO x{comboMultiplier}
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePause} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30">
            <Pause fill="currentColor" size={20} />
          </button>
          {gameState === 'playing' && (
            <button onClick={onExit} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Power-up Indicator */}
      {powerUp.active && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.8)]">
            {powerUp.type === 'slow' ? <Zap className="text-yellow-300" fill="currentColor" /> : <Bomb className="text-orange-300" />}
            <span className="font-bold text-white">
              {powerUp.type === 'slow' ? 'SLOW MOTION' : 'BOMB ACTIVATED'}
            </span>
            <span className="text-white/80 text-sm">
              {(powerUp.duration / 1000).toFixed(1)}s
            </span>
          </div>
        </motion.div>
      )}

      {/* Game Area - Items */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ scale: 2, opacity: 0, rotate: 360 }}
              transition={{ exit: { duration: 0.3 } }}
              className={`absolute flex flex-col items-center transform -translate-x-1/2 ${item.isTarget ? 'z-20' : 'z-10'}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transition: 'top 0.016s linear'
              }}
            >
              <div
                className={`px-4 py-2 rounded-lg backdrop-blur-md border-2 transition-all text-center ${item.isTarget
                    ? 'scale-110 shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-pulse'
                    : 'scale-100'
                  }`}
                style={{
                  backgroundColor: `${item.color}20`,
                  borderColor: item.color,
                  color: item.isTarget ? '#fff' : item.color
                }}
              >
                <div className="text-xl font-bold leading-tight">{item.text}</div>
                {item.subText && <div className="text-xs opacity-70">{item.subText}</div>}
              </div>
              {item.isTarget && (
                <div className="mt-1 w-3 h-3 rounded-full bg-yellow-400 animate-ping"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Particles */}
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos(particle.angle) * 100,
                y: Math.sin(particle.angle) * 100
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.color
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Controls (Options) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-24 z-30">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-3">
          {options.map((option, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleOptionClick(option)}
              className="px-2 py-4 bg-gradient-to-br from-purple-600/80 to-pink-600/80 backdrop-blur-md border-2 border-white/30 rounded-xl font-bold text-white shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all active:bg-yellow-500"
            >
              {option.split(',')[0]}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Over / Pause Overlay */}
      {gameState !== 'playing' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-3xl border-2 border-yellow-500/50 shadow-2xl text-center max-w-sm w-full"
          >
            <h2 className="text-4xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">
              {gameState === 'gameover' ? 'GAME OVER' : 'PAUSED'}
            </h2>

            <div className="space-y-3 mb-6">
              <div className="bg-black/40 py-3 rounded-xl">
                <div className="text-sm text-yellow-300">SCORE</div>
                <div className="text-3xl font-mono text-white font-black">{score}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 py-3 rounded-xl">
                  <div className="text-xs text-pink-300">MAX COMBO</div>
                  <div className="text-2xl font-bold text-white">{maxCombo}</div>
                </div>
                <div className="bg-black/40 py-3 rounded-xl">
                  <div className="text-xs text-purple-300">MULTIPLIER</div>
                  <div className="text-2xl font-bold text-white">x{Math.min(Math.floor(maxCombo / 5) + 1, 5)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw size={20} />
                RESTART
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
              >
                EXIT MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
