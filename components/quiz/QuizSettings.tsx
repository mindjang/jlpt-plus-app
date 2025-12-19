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
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-5">
        {/* 헤더 with 닫기 버튼 */}
        <div className="flex items-center justify-between pb-2 border-b border-divider">
          <h2 className="text-body font-semibold text-text-main">퀴즈 설정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-gray-100 text-text-sub"
          >
            <X size={20} />
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
                className="w-8 h-8 rounded-full bg-surface border border-divider active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faMinus} className="text-text-main" />
              </button>
              <div className="flex flex-col items-center min-w-[4rem]">
                <div className="font-bold text-text-main">
                  {questionCount}
                </div>
              </div>
              <button
                onClick={handleIncreaseCount}
                disabled={questionCount >= MAX_QUESTIONS}
                className="w-8 h-8 rounded-full bg-surface border border-divider active:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
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
                className={`py-2 rounded-lg text-body font-medium transition-all ${
                  selectedLevels.includes(level)
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-divider text-text-main active:bg-gray-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 유형 (Duolingo Style - 토글 스위치) */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            콘텐츠 유형
          </h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setIncludeWords(!includeWords)}
              className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                includeWords
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-surface border border-divider'
              }`}
            >
              <span className="text-body font-medium text-text-main">단어 포함</span>
              <div className={`w-11 h-6 rounded-full relative transition-all ${
                includeWords ? 'bg-primary' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  includeWords ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
            <button
              onClick={() => setIncludeKanji(!includeKanji)}
              className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                includeKanji
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-surface border border-divider'
              }`}
            >
              <span className="text-body font-medium text-text-main">한자 포함</span>
              <div className={`w-11 h-6 rounded-full relative transition-all ${
                includeKanji ? 'bg-primary' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  includeKanji ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* 문제 유형 선택 (Duolingo Style - 2열 그리드) */}
        <div>
          <h3 className="text-body font-semibold text-text-main mb-3">
            문제 유형
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setQuestionTypes([])}
              className={`p-3 rounded-lg text-center transition-all ${
                questionTypes.length === 0
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              <span className="text-body font-medium">혼합</span>
            </button>
            <button
              onClick={() => setQuestionTypes(['word-to-meaning'])}
              className={`p-3 rounded-lg text-center transition-all ${
                questionTypes.length === 1 && questionTypes[0] === 'word-to-meaning'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              <span className="text-body font-medium">단어→뜻</span>
            </button>
            <button
              onClick={() => setQuestionTypes(['meaning-to-word'])}
              className={`p-3 rounded-lg text-center transition-all ${
                questionTypes.length === 1 && questionTypes[0] === 'meaning-to-word'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              <span className="text-body font-medium">뜻→단어</span>
            </button>
            <button
              onClick={() => setQuestionTypes(['sentence-fill-in'])}
              className={`p-3 rounded-lg text-center transition-all ${
                questionTypes.length === 1 && questionTypes[0] === 'sentence-fill-in'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-divider text-text-main active:bg-gray-50'
              }`}
            >
              <span className="text-body font-medium">문장 완성</span>
            </button>
          </div>
        </div>

        {/* 시작 버튼 */}
        <motion.button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-primary text-white rounded-lg text-body font-bold active:opacity-90 shadow-sm"
        >
          퀴즈 시작
        </motion.button>
      </div>
    </Modal>
  )
}

