'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanjiDetail } from '@/components/ui/KanjiDetail'
import { getWordData } from '@/data'
import type { WordData } from '@/data/types'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const word = decodeURIComponent(params.word as string)
  const [wordData, setWordData] = useState<WordData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getWordData(word)
        setWordData(data || {
          level: 'N5' as const,
          kanji: word,
          onYomi: [],
          kunYomi: [],
          relatedWords: [],
        })
      } catch (error) {
        console.error('Failed to load word data:', error)
        setWordData({
          level: 'N5' as const,
          kanji: word,
          onYomi: [],
          kunYomi: [],
          relatedWords: [],
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [word])
  
  if (loading || !wordData) {
    return (
      <div className="w-full min-h-screen bg-page flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">로딩 중...</div>
      </div>
    )
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
