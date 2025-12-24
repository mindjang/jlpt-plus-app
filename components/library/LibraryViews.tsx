import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Level, levelData } from '@/data'
import { Book, Type, ArrowRight, Lock } from 'lucide-react'
import { getStudySettings, StudySettings } from '@/lib/firebase/firestore'
import { LEVEL_BG_COLORS, LEVEL_COLORS } from '@/lib/constants/colors'
import { useAuth } from '@/components/auth/AuthProvider'
import { getLevelProgress } from '@/lib/srs/queue/studyQueue'
import type { JlptLevel } from '@/lib/types/content'

// --- Types & Constants & Helpers ---
const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const getLevelTitle = (level: Level) => {
  switch (level) {
    case 'N5': return '입문 단계'
    case 'N4': return '기본 단계'
    case 'N3': return '응용 단계'
    case 'N2': return '심화 단계'
    case 'N1': return '완성 단계'
  }
}

interface ViewProps {
  onNavigate: (level: Level, type: 'word' | 'kanji') => void
}

// 진행 상황 카드 컴포넌트
interface ProgressCardProps {
  title: string
  icon: React.ReactNode
  learned: number
  total: number
  progress: number
  color: string
  onClick: () => void
  disabled?: boolean
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  icon,
  learned,
  total,
  progress,
  color,
  onClick,
  disabled = false,
}) => {
  const percentage = Math.round(progress)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-surface rounded-lg p-3.5 flex flex-col text-left transition-all shadow-soft border border-white/60 ${disabled ? 'opacity-60 cursor-not-allowed' : 'active:bg-gray-50'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        {/* 아이콘 */}
        <div className="flex items-center justify-start">
          {icon}
        </div>
        {/* 퍼센트 */}
        <div className="text-[10px] font-black" style={{ color: color }}>
          {percentage}%
        </div>
      </div>

      {/* 제목 (부연 설명) */}
      <div className="text-[10px] font-bold text-text-sub mb-0.5">{title}</div>

      {/* 숫자 (중요 정보) */}
      <div className="text-body font-black text-text-main mb-2">
        {learned.toLocaleString()}<span className="text-[10px] font-bold text-text-hint ml-0.5">/{total.toLocaleString()}</span>
      </div>

      {/* 진행 바 */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}15` }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </button>
  )
}

// --- UI 1: Stack Level View (Duolingo Style) ---
export const StackLevelView: React.FC<ViewProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<StudySettings | null>(null)
  const [progressData, setProgressData] = useState<Record<Level, {
    wordProgress: number
    kanjiProgress: number
    learnedWords: number
    learnedKanjis: number
  }>>({
    N5: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
    N4: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
    N3: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
    N2: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
    N1: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
  })

  useEffect(() => {
    getStudySettings().then(s => setSettings(s))
  }, [])

  useEffect(() => {
    if (!user) return

    const loadProgress = async () => {
      const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
      const progressPromises = levels.map(async (level) => {
        const data = levelData[level]
        try {
          const progress = await getLevelProgress(
            user.uid,
            level as JlptLevel,
            data.words,
            data.kanji
          )
          return {
            level,
            ...progress,
          }
        } catch (error) {
          console.error(`Failed to load progress for ${level}:`, error)
          return {
            level,
            learnedWords: 0,
            learnedKanjis: 0,
            wordProgress: 0,
            kanjiProgress: 0,
          }
        }
      })

      const results = await Promise.all(progressPromises)
      const newProgressData: typeof progressData = {
        N5: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
        N4: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
        N3: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
        N2: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
        N1: { wordProgress: 0, kanjiProgress: 0, learnedWords: 0, learnedKanjis: 0 },
      }

      results.forEach((result) => {
        newProgressData[result.level as Level] = {
          wordProgress: result.wordProgress,
          kanjiProgress: result.kanjiProgress,
          learnedWords: result.learnedWords,
          learnedKanjis: result.learnedKanjis,
        }
      })

      setProgressData(newProgressData)
    }

    loadProgress()
  }, [user])

  const isEnabled = (level: Level, type: 'word' | 'kanji') => {
    if (!settings) return true
    const s = settings[level]
    if (!s) return true
    return s[type]
  }

  return (
    <div className="flex flex-col pb-14">
      {levels.map((level, i) => {
        const data = levelData[level]
        const progress = progressData[level]
        const levelColor = LEVEL_COLORS[level]

        return (
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between gap-4 p-4 border-b border-white/40 last:border-none"
            style={{
              backgroundColor: LEVEL_BG_COLORS[level as Level],
            }}
          >
            {/* Level Header */}
            <div className="px-1 min-w-[3.5rem] flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-text-main leading-none" style={{
                fontFamily: 'var(--font-mungyeong), MungyeongGamhongApple, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                color: levelColor,
                textShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}>{level}</span>
            </div>

            {/* Progress Cards Grid */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {/* 단어 암기 카드 */}
              <ProgressCard
                title="단어 암기"
                icon={
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: `${levelColor}25`,
                  }}>
                    <Book size={16} style={{ color: levelColor }} />
                  </div>
                }
                learned={progress.learnedWords}
                total={data.words}
                progress={progress.wordProgress}
                color={levelColor}
                onClick={() => {
                  if (isEnabled(level, 'word')) onNavigate(level, 'word')
                }}
                disabled={!isEnabled(level, 'word')}
              />

              {/* 한자 암기 카드 */}
              <ProgressCard
                title="한자 암기"
                icon={
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: `${levelColor}25`,
                  }}>
                    <Type size={16} style={{ color: levelColor }} />
                  </div>
                }
                learned={progress.learnedKanjis}
                total={data.kanji}
                progress={progress.kanjiProgress}
                color={levelColor}
                onClick={() => {
                  if (isEnabled(level, 'kanji')) onNavigate(level, 'kanji')
                }}
                disabled={!isEnabled(level, 'kanji')}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

