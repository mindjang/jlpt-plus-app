'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { QuizSettings, QuizQuestionType } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { Modal } from '@/components/ui/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'

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
  const [questionTypes, setQuestionTypes] = useState<QuizQuestionType[]>([]) // 빈 배열 = 혼합
  const [includeWords, setIncludeWords] = useState(true)
  const [includeKanji, setIncludeKanji] = useState(true)

  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const MIN_QUESTIONS = 5
  const MAX_QUESTIONS = 35
  const STEP = 5

  const handleLevelToggle = (level: JlptLevel) => {
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== level))
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

  const handleQuestionTypeToggle = (type: QuizQuestionType) => {
    if (questionTypes.includes(type)) {
      setQuestionTypes(questionTypes.filter((t) => t !== type))
    } else {
      setQuestionTypes([...questionTypes, type])
    }
  }

  const handleStart = () => {
    if (selectedLevels.length === 0) {
      alert('최소 하나의 레벨을 선택해주세요.')
      return
    }

    if (!includeWords && !includeKanji) {
      alert('단어 또는 한자 중 하나 이상을 선택해주세요.')
      return
    }

    const settings: QuizSettings = {
      levels: selectedLevels,
      questionCount,
      questionTypes,
      includeWords,
      includeKanji,
    }

    onStart(settings)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="퀴즈 설정">
      <div className="space-y-6 p-4">
        {/* 레벨 선택 */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            JLPT 레벨 선택
          </h3>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => handleLevelToggle(level)}
                className={`px-4 py-2 rounded-lg text-body font-medium ${
                  selectedLevels.includes(level)
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-divider text-text-main active:bg-gray-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 문제 수 선택 */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            문제 수
          </h3>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDecreaseCount}
              disabled={questionCount <= MIN_QUESTIONS}
              className="w-12 h-12 rounded-full bg-surface border border-divider active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faMinus} className="text-text-main" />
            </button>
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="text-display-s font-bold text-primary">
                {questionCount}
              </div>
              <div className="text-label text-text-sub">
                문제
              </div>
            </div>
            <button
              onClick={handleIncreaseCount}
              disabled={questionCount >= MAX_QUESTIONS}
              className="w-12 h-12 rounded-full bg-surface border border-divider active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="text-text-main" />
            </button>
          </div>
          <div className="text-center mt-2 text-label text-text-sub">
            {MIN_QUESTIONS} ~ {MAX_QUESTIONS} (5씩 조절)
          </div>
        </div>

        {/* 콘텐츠 유형 */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            콘텐츠 유형
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWords}
                onChange={(e) => setIncludeWords(e.target.checked)}
                className="w-5 h-5 rounded border-divider text-primary focus:ring-primary"
              />
              <span className="text-body text-text-main">단어 포함</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeKanji}
                onChange={(e) => setIncludeKanji(e.target.checked)}
                className="w-5 h-5 rounded border-divider text-primary focus:ring-primary"
              />
              <span className="text-body text-text-main">한자 포함</span>
            </label>
          </div>
        </div>

        {/* 문제 유형 선택 */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            문제 유형
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setQuestionTypes([])}
              className={`w-full px-4 py-2 rounded-lg text-body font-medium ${
                questionTypes.length === 0
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              혼합 (랜덤)
            </button>
            <button
              onClick={() => setQuestionTypes(['word-to-meaning'])}
              className={`w-full px-4 py-2 rounded-lg text-body font-medium ${
                questionTypes.length === 1 && questionTypes[0] === 'word-to-meaning'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              단어 → 뜻
            </button>
            <button
              onClick={() => setQuestionTypes(['meaning-to-word'])}
              className={`w-full px-4 py-2 rounded-lg text-body font-medium ${
                questionTypes.length === 1 && questionTypes[0] === 'meaning-to-word'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              뜻 → 단어
            </button>
            <button
              onClick={() => setQuestionTypes(['sentence-fill-in'])}
              className={`w-full px-4 py-2 rounded-lg text-body font-medium ${
                questionTypes.length === 1 && questionTypes[0] === 'sentence-fill-in'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              문장 완성
            </button>
          </div>
        </div>

        {/* 시작 버튼 */}
        <motion.button
          onClick={handleStart}
          className="w-full py-4 bg-primary text-white rounded-lg text-title font-semibold active:opacity-80"
        >
          퀴즈 시작
        </motion.button>
      </div>
    </Modal>
  )
}

