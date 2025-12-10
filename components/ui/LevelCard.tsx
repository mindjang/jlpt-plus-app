'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Level, levelData, levelGradients } from '@/data'
import { LevelChip } from './LevelChip'

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
      className="relative w-full h-[calc(100vh-120px)] overflow-hidden cursor-pointer bg-surface flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        // background: 'transparent',
      }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08 }}
    >
      <div className="max-w-[20rem] mx-auto flex flex-col items-center justify-center gap-4">
        <LevelChip level={level} className="text-xl bg-white text-level-${level.toLowerCase()}" />
        {/* <img src={`/char/${level.toLowerCase()}.png`} alt={level} className="w-[10rem] mx-auto object-contain" /> */}
        <div className='grid grid-cols-1 gap-2 w-full'>
          <p className={`text-md text-center text-level-${level.toLowerCase()} font-bold px-2 py-1 rounded-chip `}>
            {words} 단어
          </p>
          <p className={`text-md text-center text-level-${level.toLowerCase()} font-bold px-2 py-1 rounded-chip `}>
            {kanji} 한자
          </p>
        </div>
      </div>
    </motion.div>
  )
}


