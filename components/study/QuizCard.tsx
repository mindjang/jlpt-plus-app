'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QuizQuestion } from '@/lib/types/quiz'

interface QuizCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (selectedAnswer: string) => void
  disabled?: boolean
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled = false,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // 문제 변경 시 상태 초기화
  useEffect(() => {
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(false)
  }, [question.id])

  const handleSelectAnswer = (answer: string) => {
    if (disabled || showResult) return

    setSelectedAnswer(answer)
    const correct = answer === question.answer
    setIsCorrect(correct)
    setShowResult(true)

    // 1초 후 다음 문제로
    setTimeout(() => {
      onAnswer(answer)
    }, 1000)
  }

  // 문장에서 빈칸 렌더링
  const renderSentenceWithBlank = (sentence: string, blankPos?: { start: number; end: number }) => {
    if (!blankPos) {
      return <span>{sentence}</span>
    }

    const before = sentence.substring(0, blankPos.start)
    const blank = sentence.substring(blankPos.start, blankPos.end)
    const after = sentence.substring(blankPos.end)

    return (
      <>
        <span>{before}</span>
        <span className="inline-block min-w-[80px] mx-1 px-3 py-1 border-2 border-dashed border-primary bg-primary bg-opacity-10 rounded text-center">
          {showResult ? blank : '　'}
        </span>
        <span>{after}</span>
      </>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 진행도 바 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-label text-text-sub">
            문제 {questionNumber} / {totalQuestions}
          </span>
          <span className="text-label text-text-sub">
            {Math.round((questionNumber / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 문제 카드 */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-card shadow-soft p-8 mb-6"
      >
        {/* 문제 유형 표시 */}
        <div className="text-center mb-4">
          <span className="text-label text-text-sub bg-page px-3 py-1 rounded-full">
            {question.type === 'sentence-fill-in' 
              ? '문장 완성' 
              : question.type === 'word-to-meaning' 
              ? '뜻 맞추기' 
              : '단어 맞추기'}
          </span>
        </div>

        {/* 질문 텍스트 */}
        <div className="text-center mb-8">
          {question.type === 'sentence-fill-in' && question.sentenceJa ? (
            <div>
              <div className="text-jp text-title mb-3 flex items-center justify-center flex-wrap leading-relaxed">
                {renderSentenceWithBlank(question.sentenceJa, question.blankPosition)}
              </div>
              <div className="text-body text-text-sub">
                {question.sentenceKo}
              </div>
            </div>
          ) : (
            <h2 className="text-display-m text-jp font-medium text-text-main">
              {question.question}
            </h2>
          )}
        </div>

        {/* 보기 */}
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrectAnswer = option === question.answer
            
            let buttonClass = 'w-full py-4 px-6 rounded-card text-body font-medium transition-all duration-200 '
            
            if (!showResult) {
              buttonClass += isSelected
                ? 'bg-primary text-white'
                : 'bg-surface border-2 border-divider text-text-main hover:border-primary'
            } else {
              if (isCorrectAnswer) {
                buttonClass += 'bg-green-500 text-white border-2 border-green-600'
              } else if (isSelected && !isCorrect) {
                buttonClass += 'bg-red-500 text-white border-2 border-red-600'
              } else {
                buttonClass += 'bg-surface border-2 border-divider text-text-sub opacity-50'
              }
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                disabled={disabled || showResult}
                className={buttonClass}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-center gap-2">
                  {showResult && isCorrectAnswer && <span>✓</span>}
                  {showResult && isSelected && !isCorrect && <span>✗</span>}
                  <span className={question.type === 'meaning-to-word' || question.type === 'sentence-fill-in' ? 'text-jp' : ''}>
                    {option}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* 피드백 메시지 */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center py-4 px-6 rounded-card ${
              isCorrect
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <p className="text-body font-medium">
              {isCorrect ? '정답입니다! 🎉' : '아쉽네요... 다음 기회에!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}