'use client'

import React, { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { getKanjiByLevel } from '@/data/kanji/index'
import { levels, Level } from '@/data'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getFirstMeaning,
} from '@/lib/data/kanji/kanjiHelpers'

function KanjiListContent() {
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

  const kanjiList = useMemo(() => {
    return getKanjiByLevel(level)
  }, [level])

  const handleItemClick = (kanji: string) => {
    router.push(`/acquire/kanji/${encodeURIComponent(kanji)}`)
  }

  // KanjiAliveEntry를 SearchResult 형식으로 변환
  const kanjiResults = useMemo(() => {
    return kanjiList.map((entry) => {
      const character = getKanjiCharacter(entry)
      const onYomi = getOnYomi(entry)
      const kunYomi = getKunYomi(entry)
      const meaning = getFirstMeaning(entry)
      const furigana = onYomi[0] || kunYomi[0] || undefined

      return {
        level,
        word: character,
        furigana,
        meaning,
      }
    })
  }, [kanjiList, level])

  return (
    <div className="w-full">
      <AppBar 
        title={`${level} 한자`} 
        onBack={() => router.back()} 
      />
      
      <div className="p-4">
        <div className="mb-4 text-body text-text-sub">
          총 {kanjiResults.length}개의 한자
        </div>
        
        <div className="space-y-2">
          {kanjiResults.map((item, index) => (
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

export default function KanjiListPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="한자" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <KanjiListContent />
    </Suspense>
  )
}

