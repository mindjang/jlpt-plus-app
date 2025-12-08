'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanjiDetail } from '@/components/ui/KanjiDetail'
import { getWordData, findWord } from '@/data'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const word = decodeURIComponent(params.id as string)

  // 단어 데이터에서 먼저 찾기
  const searchResult = findWord(word)
  
  // 단어 데이터가 있으면 한자 정보도 가져오기
  let wordData = null
  if (searchResult && searchResult.kanjiDetails && searchResult.kanjiDetails.length > 0) {
    // 첫 번째 한자 정보 사용
    const firstKanji = searchResult.kanjiDetails[0]
    wordData = {
      level: searchResult.level,
      kanji: firstKanji.kanji,
      onYomi: firstKanji.onReadings || [],
      kunYomi: firstKanji.kunReadings || [],
      radical: undefined,
      strokeCount: firstKanji.strokeCount,
      relatedWords: searchResult.kanjiDetails.map(k => ({
        word: searchResult.word,
        furigana: searchResult.furigana,
        meaning: searchResult.meaning,
      })),
    }
  } else {
    // 한자 데이터에서 찾기
    const kanjiData = getWordData(word)
    if (kanjiData) {
      wordData = kanjiData
    } else {
      // 기본값
      wordData = {
        level: 'N5' as const,
        kanji: word,
        onYomi: [],
        kunYomi: [],
        relatedWords: [],
      }
    }
  }

  return (
    <div className="w-full">
      <AppBar
        title="단어 상세"
        onBack={() => router.back()}
      />

      <div className="p-4">
        <div className="bg-surface rounded-card p-6">
          {searchResult && (
            <div className="mb-6">
              <h1 className="text-display-l text-jp font-medium text-text-main mb-2">
                {searchResult.word}
              </h1>
              {searchResult.furigana && (
                <div className="text-subtitle text-text-sub mb-2">
                  {searchResult.furigana}
                </div>
              )}
              <div className="text-title text-text-main font-semibold mb-4">
                {searchResult.meaning}
              </div>
            </div>
          )}
          
          {wordData && (
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
          )}
        </div>
      </div>
    </div>
  )
}

