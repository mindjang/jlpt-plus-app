'use client'

import React, { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { getWordsByLevel } from '@/data/words/index'
import { levels, Level } from '@/data'

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
    return getWordsByLevel(level)
  }, [level])

  const handleItemClick = (word: string) => {
    router.push(`/acquire/word/${encodeURIComponent(word)}`)
  }

  return (
    <div className="w-full">
      <AppBar 
        title={`${level} 단어`} 
        onBack={() => router.back()} 
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

