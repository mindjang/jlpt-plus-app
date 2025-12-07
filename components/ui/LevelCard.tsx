'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Level, levelData, levelGradients } from '@/data'

interface LevelCardProps {
  level: Level
  wordCount?: number
  kanjiCount?: number
  onClick?: () => void
}

export const LevelCard: React.FC<LevelCardProps> = ({ 
  level, 
  wordCount, 
  kanjiCount, 
  onClick 
}) => {
  const gradient = levelGradients[level]
  const data = levelData[level]
  const words = wordCount ?? data.words
  const kanji = kanjiCount ?? data.kanji

  return (
    <motion.div
      className="relative w-[65%] max-w-[20rem] aspect-[4/5] rounded-levelCard shadow-soft overflow-hidden cursor-pointer bg-surface"
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        maxWidth: 'calc(100vw - 2rem)',
      }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08 }}
    >
      <div className="flex flex-col h-full p-[1.125rem]">
        {/* 상단 단어/한자 수 */}
        <p className="text-body text-text-sub mb-auto">
          {words}단어·{kanji}한자
        </p>
        
        {/* 중앙 레벨 표시 */}
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-display-s text-jp font-semibold text-text-main">
            {level}
          </h2>
        </div>

        {/* 하단 캐릭터 일러스트 영역 */}
        <div className="flex justify-end items-end h-32 relative overflow-hidden">
          {/* Blob 배경 - 더 자연스러운 형태 */}
          <div 
            className="absolute bottom-0 right-0 w-48 h-48 opacity-40"
            style={{
              background: `radial-gradient(ellipse at 60% 70%, ${gradient.to} 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: 'translate(20%, 20%)',
            }}
          />
          {/* 캐릭터 - 하단 오른쪽에 배치 */}
          <div className="relative z-10 mr-4 mb-2">
            <svg width="80" height="80" viewBox="0 0 80 80" className="text-text-main">
              {/* 왼쪽 눈 */}
              <circle cx="28" cy="32" r="4" fill="currentColor" />
              {/* 오른쪽 눈 */}
              <circle cx="52" cy="32" r="4" fill="currentColor" />
              {/* 입 (웃는 곡선) */}
              <path 
                d="M 22 48 Q 40 58 58 48" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


