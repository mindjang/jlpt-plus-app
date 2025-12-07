'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface KanaItem {
  kana: string
  romaji: string
}

interface KanaGridProps {
  items: KanaItem[]
  columns?: 2 | 3 | 4 | 5 | 6
  onItemClick?: (item: KanaItem) => void
  emptySlots?: number[] // 빈 칸이 들어갈 인덱스 위치
}

export const KanaGrid: React.FC<KanaGridProps> = ({
  items,
  columns = 4,
  onItemClick,
  emptySlots = [],
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }

  // emptySlots가 지정된 경우 (청음 그룹의 특수 배치)
  if (emptySlots.length > 0) {
    const totalSlots = items.length + emptySlots.length
    const result: (KanaItem | null)[] = new Array(totalSlots).fill(null)
    let itemIndex = 0
    
    for (let i = 0; i < totalSlots; i++) {
      if (emptySlots.includes(i)) {
        result[i] = null // 빈 칸
      } else {
        result[i] = items[itemIndex++]
      }
    }

    return (
      <div className={`grid ${gridCols[5]} gap-2`}>
        {result.map((item, index) => {
          if (item === null) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square"
                aria-hidden="true"
              />
            )
          }
          return (
            <motion.button
              key={index}
              className="aspect-square flex flex-col items-center justify-center rounded-kanji border border-divider bg-surface hover:bg-page transition-colors button-press"
              onClick={() => onItemClick?.(item)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-[1.25rem] md:text-[1.5rem] text-jp text-text-main">
                {item.kana}
              </span>
              <span className="text-[0.75rem] text-text-sub">{item.romaji}</span>
            </motion.button>
          )
        })}
      </div>
    )
  }

  // 기존 로직 (일반 그리드)
  // columns를 그대로 사용 (요음은 3열로 유지)
  const emptySlotsCount = 0

  // 3열일 때 5열 그리드의 카드 높이를 참조하기 위한 ref
  const containerRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState<number | null>(null)

  useEffect(() => {
    if (columns === 3 && containerRef.current) {
      // 컨테이너 너비를 기준으로 5열 그리드의 카드 높이 계산
      const containerWidth = containerRef.current.offsetWidth
      const gap = 8 // gap-2 = 0.5rem = 8px
      // 5열 그리드: 카드 너비 = (컨테이너 너비 - gap*4) / 5
      // aspect-square이므로 높이 = 너비
      const cardWidth = (containerWidth - gap * 4) / 5
      setCardHeight(cardWidth)
    }
  }, [columns])

  // 3열일 때 카드 높이를 5열 그리드와 동일하게 맞추기
  const cardStyle = columns === 3 && cardHeight 
    ? { height: `${cardHeight}px` }
    : undefined

  return (
    <div ref={containerRef} className={`grid ${gridCols[columns]} gap-2`}>
      {items.map((item, index) => (
        <motion.button
          key={index}
          className={`${columns === 3 ? '' : 'aspect-square'} flex flex-col items-center justify-center rounded-kanji border border-divider bg-surface hover:bg-page transition-colors button-press`}
          style={cardStyle}
          onClick={() => onItemClick?.(item)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.01 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-[1.25rem] md:text-[1.5rem] text-jp text-text-main">
            {item.kana}
          </span>
          <span className="text-[0.75rem] text-text-sub">{item.romaji}</span>
        </motion.button>
      ))}
      {/* 빈 칸 추가 */}
      {Array.from({ length: emptySlotsCount }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="aspect-square"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}


