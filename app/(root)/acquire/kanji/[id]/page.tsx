'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanjiDetail } from '@/components/ui/KanjiDetail'
import { getWordData } from '@/data'

export default function KanjiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const kanji = decodeURIComponent(params.id as string)

  // 데이터에서 가져오기 (없으면 기본값)
  const kanjiData = getWordData(kanji) || {
    level: 'N5' as const,
    kanji: kanji,
    onYomi: [],
    kunYomi: [],
    relatedWords: [],
  }

  return (
    <div className="w-full">
      <AppBar
        title="한자 상세"
        onBack={() => router.back()}
      />

      <div className="p-4">
        <div className="bg-surface rounded-card p-6">
          <KanjiDetail
            level={kanjiData.level}
            kanji={kanjiData.kanji}
            onYomi={kanjiData.onYomi}
            kunYomi={kanjiData.kunYomi}
            radical={kanjiData.radical}
            strokeCount={kanjiData.strokeCount}
            relatedWords={kanjiData.relatedWords}
            onStrokeOrderClick={() => {
              // 획순 애니메이션 로직
              console.log('Show stroke order')
            }}
          />
        </div>
      </div>
    </div>
  )
}

