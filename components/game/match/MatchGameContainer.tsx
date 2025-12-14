'use client'

import React from 'react'
import { Level } from '@/data'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Clock, Target, Trophy, Pause, X } from 'lucide-react'
import { useMatchEngine } from './useMatchEngine'

interface MatchGameContainerProps {
  level: Level
  mode: 'word' | 'kanji'
  difficulty: 'easy' | 'medium' | 'hard'
  onExit: () => void
}

export function MatchGameContainer({ level, mode, difficulty, onExit }: MatchGameContainerProps) {
  const {
    gameState,
    cards,
    matchedPairs,
    totalPairs,
    moves,
    timeElapsed,
    handleCardClick,
    togglePause,
    restartGame
  } = useMatchEngine(level, mode, difficulty)

  const gridCols = difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4'
  const cardSize = difficulty === 'easy' ? 'h-28' : difficulty === 'medium' ? 'h-24' : 'h-20'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/30 to-transparent z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
              <Clock size={18} className="text-yellow-300" />
              <span className="font-mono font-bold text-white">{formatTime(timeElapsed)}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
              <Target size={18} className="text-pink-300" />
              <span className="font-bold text-white">{moves} 이동</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
              <span className="font-bold text-white">{matchedPairs}/{totalPairs} 쌍</span>
            </div>
            {gameState === 'playing' && (
              <>
                <button
                  onClick={togglePause}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:bg-white/30"
                >
                  <Pause fill="currentColor" size={20} />
                </button>
                <button
                  onClick={onExit}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white active:bg-white/30"
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="absolute inset-0 flex items-center justify-center p-6 pt-24">
        <div className={`grid ${gridCols} gap-3 max-w-2xl w-full`}>
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className={`${cardSize} perspective-1000`}
              >
                <motion.button
                  onClick={() => handleCardClick(card.id)}
                  className="w-full h-full relative preserve-3d"
                  animate={{
                    rotateY: card.isFlipped || card.isMatched ? 180 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  disabled={card.isMatched}
                >
                  {/* Card Back */}
                  <div className="absolute inset-0 backface-hidden rounded-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/50 flex items-center justify-center">
                    <div className="text-4xl">🎴</div>
                  </div>

                  {/* Card Front */}
                  <div
                    className={`absolute inset-0 backface-hidden rounded-lg border flex items-center justify-center p-2 ${card.isMatched
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300'
                      : card.type === 'question'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-300'
                        : 'bg-gradient-to-br from-pink-500 to-purple-500 border-pink-300'
                      }`}
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="text-white font-bold text-center break-words text-base leading-tight">
                      {card.content}
                    </div>
                    {card.isMatched && (
                      <div className="absolute top-1 right-1 text-white">✓</div>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-lg border border-divider text-center max-w-sm w-full mx-4"
          >
            <h2 className="text-4xl font-black text-purple-600 mb-4">
              일시정지
            </h2>

            <div className="space-y-3 mb-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 py-3 rounded-lg">
                <div className="text-sm text-purple-600">경과 시간</div>
                <div className="text-3xl font-black text-purple-700">{formatTime(timeElapsed)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-100 py-3 rounded-lg">
                  <div className="text-xs text-blue-600">이동 횟수</div>
                  <div className="text-2xl font-bold text-blue-700">{moves}</div>
                </div>
                <div className="bg-pink-100 py-3 rounded-lg">
                  <div className="text-xs text-pink-600">매칭</div>
                  <div className="text-2xl font-bold text-pink-700">{matchedPairs}/{totalPairs}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={togglePause}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold active:opacity-80"
              >
                계속하기
              </button>
              <button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 active:opacity-80"
              >
                <RotateCcw size={20} />
                다시 하기
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg font-bold"
              >
                메뉴로
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Overlay */}
      {gameState === 'complete' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-lg border border-divider text-center max-w-sm w-full mx-4"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-purple-600 mb-4">
              완료!
            </h2>

            <div className="space-y-3 mb-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 py-3 rounded-lg">
                <div className="text-sm text-purple-600 flex items-center justify-center gap-2">
                  <Clock size={16} />
                  시간
                </div>
                <div className="text-3xl font-black text-purple-700">{formatTime(timeElapsed)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-100 py-3 rounded-lg">
                  <div className="text-xs text-blue-600">이동 횟수</div>
                  <div className="text-2xl font-bold text-blue-700">{moves}</div>
                </div>
                <div className="bg-pink-100 py-3 rounded-lg">
                  <div className="text-xs text-pink-600">매칭</div>
                  <div className="text-2xl font-bold text-pink-700">{totalPairs}쌍</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 active:opacity-80"
              >
                <RotateCcw size={20} />
                다시 하기
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg font-bold"
              >
                메뉴로
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}
