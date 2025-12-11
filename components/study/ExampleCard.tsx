'use client'

import React from 'react'
import type { Word, Kanji, JlptLevel } from '@/lib/types/content'
import type { Grade, UserCardState } from '@/lib/types/srs'
import { reviewCard } from '@/lib/srs/reviewCard'
import { WordCard } from './WordCard'
import { KanjiCard } from './KanjiCard'

interface ExampleCardProps {
  item: Word | Kanji
  type: 'word' | 'kanji'
  level: string
  isNew?: boolean
  cardState?: UserCardState | null
  onGrade: (grade: Grade) => void
  onNext: () => void
  allWords?: Word[] // 한자 학습 시 해당 한자가 포함된 단어 찾기용
  onGradeStateChange?: (selectedGrade: Grade | null, nextReviewInterval: number | null) => void
}

/**
 * 예문 학습 카드 래퍼 컴포넌트
 * 단어와 한자 카드를 타입에 따라 분기하여 표시
 */
export const ExampleCard: React.FC<ExampleCardProps> = ({
  item,
  type,
  level,
  isNew = false,
  cardState = null,
  onGrade,
  onNext,
  allWords = [],
  onGradeStateChange,
}) => {
  const handleGrade = (grade: Grade) => {
    // 다음 복습 간격 계산 (실제 SRS 로직 사용)
    const updatedState = reviewCard(cardState, {
      itemId: item.id,
      type: type as 'word' | 'kanji',
      level: level as JlptLevel,
      grade,
    })
    
    // 상태 변경 콜백 호출 (UI 업데이트용)
    onGradeStateChange?.(grade, updatedState.interval)
    
    // 부모 컴포넌트의 handleGrade 호출 (저장 및 다음 카드 이동은 부모에서 처리)
    onGrade(grade)
  }

  if (type === 'word') {
    return (
      <WordCard
        word={item as Word}
        isNew={isNew}
        cardState={cardState}
        onGrade={handleGrade}
        onNext={onNext}
        onGradeStateChange={onGradeStateChange}
      />
    )
  }

  return (
    <KanjiCard
      kanji={item as Kanji}
      level={level}
      isNew={isNew}
      cardState={cardState}
      onGrade={handleGrade}
      onNext={onNext}
      onGradeStateChange={onGradeStateChange}
    />
  )
}

