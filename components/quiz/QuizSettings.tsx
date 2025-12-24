'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { QuizSettings, QuizQuestionType } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { Modal } from '@/components/ui/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus, faX } from '@fortawesome/free-solid-svg-icons'
import { X } from 'lucide-react'

interface QuizSettingsProps {
  isOpen: boolean
  onClose: () => void
  onStart: (settings: QuizSettings) => void
}

export function QuizSettingsModal({
  isOpen,
  onClose,
  onStart,
}: QuizSettingsProps) {
  const [selectedLevels, setSelectedLevels] = useState<JlptLevel[]>(['N5'])
  const [questionCount, setQuestionCount] = useState<number>(20)
  const [questionType, setQuestionType] = useState<QuizQuestionType>('word-to-meaning') // 단일 선택

  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const MIN_QUESTIONS = 5
  const MAX_QUESTIONS = 35
  const STEP = 5

  const handleLevelToggle = (level: JlptLevel) => {
    if (selectedLevels.includes(level)) {
      // 최소 1개는 선택되어야 함
      if (selectedLevels.length > 1) {
        setSelectedLevels(selectedLevels.filter((l) => l !== level))
      }
    } else {
      setSelectedLevels([...selectedLevels, level])
    }
  }

  const handleIncreaseCount = () => {
    setQuestionCount((prev) => Math.min(prev + STEP, MAX_QUESTIONS))
  }

  const handleDecreaseCount = () => {
    setQuestionCount((prev) => Math.max(prev - STEP, MIN_QUESTIONS))
  }

  const handleQuestionTypeSelect = (type: QuizQuestionType) => {
    setQuestionType(type)
  }

  const handleStart = () => {
    if (selectedLevels.length === 0) {
      alert('최소 하나의 레벨을 선택해주세요.')
      return
    }

    const settings: QuizSettings = {
      levels: selectedLevels,
      questionCount,
      questionTypes: [questionType], // 배열로 변환
    }

    onStart(settings)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-5">
        {/* 헤더 with 닫기 버튼 */}
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-body font-semibold text-text-main">퀴즈 설정</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-gray-100 text-text-sub"
          >
            <X size={24} />
          </button>
        </div>

        {/* 문제 수 선택 - 메인 설정 (Duolingo Style) */}
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-text-main mb-3">
            문제 수
          </h3>
          <div>
            <div className="flex items-center justify-center gap-0">
              <button
                onClick={handleDecreaseCount}
                disabled={questionCount <= MIN_QUESTIONS}
                className="w-8 h-8 rounded-full bg-surface shadow-soft active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faMinus} className="text-text-main" />
              </button>
              <div className="flex flex-col items-center min-w-[4rem]">
                <div className="text-title font-black text-text-main">
                  {questionCount}
                </div>
              </div>
              <button
                onClick={handleIncreaseCount}
                disabled={questionCount >= MAX_QUESTIONS}
                className="w-8 h-8 rounded-full bg-surface shadow-soft active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="text-text-main" />
              </button>
            </div>
          </div>

        </div>

        {/* 레벨 선택 (Duolingo Style - 5열 그리드) */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            JLPT 레벨
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => handleLevelToggle(level)}
                className={`py-2 rounded-lg text-body font-medium transition-all ${selectedLevels.includes(level)
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface shadow-soft text-text-main active:bg-gray-50'
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 문제 유형 선택 (단일 선택) */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            문제 유형
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => handleQuestionTypeSelect('word-to-meaning')}
              className={`p-3 rounded-lg text-center transition-all ${questionType === 'word-to-meaning'
                  ? 'bg-level-n5 text-white shadow-card'
                  : 'bg-surface shadow-soft text-text-main active:bg-gray-50'
                }`}
            >
              <span className="text-body font-medium">단어→뜻</span>
            </button>
            <button
              onClick={() => handleQuestionTypeSelect('meaning-to-word')}
              className={`p-3 rounded-lg text-center transition-all ${questionType === 'meaning-to-word'
                  ? 'bg-level-n5 text-white shadow-card'
                  : 'bg-surface shadow-soft text-text-main active:bg-gray-50'
                }`}
            >
              <span className="text-body font-medium">뜻→단어</span>
            </button>
            <button
              onClick={() => handleQuestionTypeSelect('sentence-fill-in')}
              className={`p-3 rounded-lg text-center transition-all ${questionType === 'sentence-fill-in'
                  ? 'bg-level-n5 text-white shadow-card'
                  : 'bg-surface shadow-soft text-text-main active:bg-gray-50'
                }`}
            >
              <span className="text-body font-medium">문장 완성</span>
            </button>
          </div>
        </div>

        {/* 시작 버튼 */}
        <motion.button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 shadow-card"
        >
          퀴즈 시작
        </motion.button>
      </div>
    </Modal>
  )
}

