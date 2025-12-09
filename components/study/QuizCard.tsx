'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Word, Kanji } from '@/lib/types/content'
import type { Grade } from '@/lib/types/srs'
import { LevelChip } from '../ui/LevelChip'

interface QuizCardProps {
  item: Word | Kanji
  type: 'word' | 'kanji'
  level: string
  allItems: (Word | Kanji)[]
  isNew?: boolean
  onGrade: (grade: Grade) => void
  onNext: () => void
}

export const QuizCard: React.FC<QuizCardProps> = ({
  item,
  type,
  level,
  allItems,
  isNew = false,
  onGrade,
  onNext,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const isWord = type === 'word'
  const word = isWord ? (item as Word) : null
  const kanji = !isWord ? (item as Kanji) : null

  // 객관식 보기 생성 (정답 1개 + 오답 3개)
  const choices = useMemo(() => {
    const correctAnswer = word ? word.meaningKo : kanji?.meaningKo || ''
    const sameLevelItems = allItems.filter((i) => i.level === item.level && i.id !== item.id)
    
    // 랜덤으로 3개 선택
    const shuffled = [...sameLevelItems].sort(() => Math.random() - 0.5)
    const wrongAnswers = shuffled
      .slice(0, 3)
      .map((i) => (isWord ? (i as Word).meaningKo : (i as Kanji).meaningKo))
      .filter((m) => m && m !== correctAnswer)

    // 정답 + 오답 섞기
    const allChoices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
    return allChoices
  }, [item, allItems, word, kanji, isWord])

  const handleSelect = (choice: string) => {
    if (showResult) return
    setSelectedAnswer(choice)
    setShowResult(true)

    const correctAnswer = word ? word.meaningKo : kanji?.meaningKo || ''
    const isCorrect = choice === correctAnswer

    // 정답 여부에 따라 grade 결정
    const grade: Grade = isCorrect ? 'good' : 'again'
    // 평가는 즉시 수행하지만, 다음으로 이동은 사용자가 "다음" 버튼을 클릭할 때
    onGrade(grade)
  }

  const correctAnswer = word ? word.meaningKo : kanji?.meaningKo || ''
  const isCorrect = selectedAnswer === correctAnswer

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 카드 */}
      <motion.div
        className="bg-surface rounded-card shadow-soft p-8 relative"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {/* NEW 라벨 */}
        {isNew && (
          <div className="absolute top-4 right-4">
            <span className="text-label font-medium text-primary bg-level-n5 px-2 py-1 rounded-chip">
              NEW
            </span>
          </div>
        )}

        {/* 카드 내용 */}
        <div className="text-center mb-8">
          {/* 레벨 칩 */}
          <div className="mb-4">
            <LevelChip level={level as any} />
          </div>

          {/* 문제 표시 */}
          {word && (
            <div className="mb-6">
              <h1 className="text-display-l text-jp font-medium text-text-main mb-2">
                {word.kanji || word.kana}
              </h1>
              {word.kanji && (
                <div className="text-subtitle text-text-sub">
                  {word.kana}
                </div>
              )}
            </div>
          )}

          {kanji && (
            <div className="mb-6">
              <h1 className="text-display-l text-jp font-medium text-text-main mb-2">
                {kanji.character}
              </h1>
              <div className="text-subtitle text-text-sub">
                {kanji.onyomi.join('・')} / {kanji.kunyomi.join('・')}
              </div>
            </div>
          )}

          <p className="text-title text-text-main font-semibold mb-6">
            다음 중 올바른 뜻을 선택하세요
          </p>

          {/* 결과 표시 */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 rounded-card ${
                isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p className={`text-body font-medium ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {isCorrect ? '정답입니다!' : '틀렸습니다.'}
              </p>
              <p className="text-body text-text-sub mt-1">
                정답: {correctAnswer}
              </p>
            </motion.div>
          )}
        </div>

        {/* 객관식 보기 */}
        <div className="flex flex-col gap-3 mb-4">
          {choices.map((choice, index) => {
            const isSelected = selectedAnswer === choice
            const isCorrectChoice = choice === correctAnswer
            const showCorrect = showResult && isCorrectChoice

            return (
              <button
                key={index}
                onClick={() => handleSelect(choice)}
                disabled={showResult}
                className={`button-press w-full py-3 px-4 rounded-card text-body font-medium text-left transition-colors ${
                  showResult && showCorrect
                    ? 'bg-green-500 text-white'
                    : showResult && isSelected && !isCorrectChoice
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-divider text-text-main hover:bg-divider'
                }`}
              >
                {choice}
              </button>
            )
          })}
        </div>

        {/* 다음 버튼 */}
        {showResult && (
          <button
            onClick={() => {
              onNext()
            }}
            className="button-press w-full py-3 px-4 rounded-card bg-primary text-surface text-body font-medium"
          >
            다음
          </button>
        )}
      </motion.div>
    </div>
  )
}

