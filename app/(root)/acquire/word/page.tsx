'use client'

import React, { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { getNaverWordsByLevel } from '@/data/words/index'
import { levels, Level } from '@/data'
import type { NaverWord } from '@/data/types'

function WordListContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = searchParams.get('level')
  
  // 레벨 파라미터를 Level 타입으로 변환
  const level: Level = useMemo(() => {
    if (levelParam) {
      const upperLevel = levelParam.toUpperCase() as Level
      if (levels.includes(upperLevel)) {
        return upperLevel
      }
    }
    return 'N5' // 기본값
  }, [levelParam])

  const words = useMemo(() => {
    const naverWords = getNaverWordsByLevel(level)
    // NaverWord를 SearchResult 형식으로 변환
    return naverWords.map((w: NaverWord) => {
      const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
        ? w.partsMeans[0].means[0]
        : ''
      const levelMap: Record<string, Level> = {
        '1': 'N1',
        '2': 'N2',
        '3': 'N3',
        '4': 'N4',
        '5': 'N5',
      }
      return {
        level: levelMap[w.level] || 'N5',
        word: w.entry,
        furigana: undefined,
        meaning: firstMean,
      }
    })
  }, [level])

  const handleItemClick = (word: string) => {
    router.push(`/acquire/word/${encodeURIComponent(word)}`)
  }

  return (
    <div className="w-full">
      <AppBar 
        title={`${level} 단어`} 
        onBack={() => window.location.href = `/acquire`} 
      />
      
      <div className="p-4">
        <div className="mb-4 text-body text-text-sub">
          총 {words.length}개의 단어
        </div>
        
        <div className="space-y-2">
          {words.map((item, index) => (
            <ListItem
              key={`${item.word}-${index}`}
              level={item.level}
              word={item.word}
              furigana={item.furigana}
              meaning={item.meaning}
              onClick={() => handleItemClick(item.word)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WordListPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="단어" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <WordListContent />
    </Suspense>
  )
}

