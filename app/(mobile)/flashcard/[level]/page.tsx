'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { FlashCard } from '@/components/ui/FlashCard'
import { Level, getFlashCards } from '@/data'

export default function FlashCardPage() {
  const router = useRouter()
  const params = useParams()
  const level = (params.level as string)?.toUpperCase() as Level || 'N5'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNew, setShowNew] = useState(true)

  const sampleCards = getFlashCards(level)
  const currentCard = sampleCards[currentIndex]

  const handleNext = () => {
    if (currentIndex < sampleCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowNew(false)
    } else {
      router.push(`/auto-study/${params.level}`)
    }
  }

  const handleKnow = () => {
    // 알고 있는 단어 처리
    handleNext()
  }

  const handleReview = () => {
    // 다시 학습할 단어 처리
    handleNext()
  }

  return (
    <>
      <AppBar
        title={`${level} 플래시카드`}
        onBack={() => router.back()}
      />

      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-4">
        <FlashCard
          level={level}
          kanji={currentCard.kanji}
          furigana={currentCard.furigana}
          meaning={currentCard.meaning}
          example={currentCard.example}
          exampleMeaning={currentCard.exampleMeaning}
          onNext={handleNext}
          onKnow={handleKnow}
          onReview={handleReview}
          showNew={showNew}
        />
      </div>
    </>
  )
}
