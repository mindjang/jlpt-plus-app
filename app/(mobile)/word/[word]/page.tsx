'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanjiDetail } from '@/components/ui/KanjiDetail'
import { getWordData } from '@/data'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const word = decodeURIComponent(params.word as string)

  // 데이터에서 가져오기 (없으면 기본값)
  const wordData = getWordData(word) || {
    level: 'N5' as const,
    kanji: word,
    onYomi: [],
    kunYomi: [],
    relatedWords: [],
  }

  return (
    <>
      <AppBar
        title="단어 상세"
        onBack={() => router.back()}
      />

      <div className="p-4">
        <div className="bg-surface rounded-card p-6">
          <KanjiDetail
            level={wordData.level}
            kanji={wordData.kanji}
            onYomi={wordData.onYomi}
            kunYomi={wordData.kunYomi}
            radical={wordData.radical}
            strokeCount={wordData.strokeCount}
            relatedWords={wordData.relatedWords}
            onStrokeOrderClick={() => {
              // 획순 애니메이션 로직
              console.log('Show stroke order')
            }}
          />
        </div>
      </div>
    </>
  )
}
