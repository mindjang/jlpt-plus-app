'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanjiDetail } from '@/components/ui/KanjiDetail'
import { getWordData } from '@/data'
import { findNaverWord } from '@/data/words/index'
import type { NaverWord } from '@/data/words/index'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const word = decodeURIComponent(params.id as string)

  // 네이버 단어 데이터에서 찾기
  const naverWord = findNaverWord(word)
  
  // 한자 정보 가져오기
  let wordData = null
  if (naverWord) {
    // 네이버 단어가 있으면 한자 데이터에서 찾기
    const kanjiData = getWordData(naverWord.entry)
    if (kanjiData) {
      wordData = kanjiData
    } else {
      // 기본값
      const levelMap: Record<string, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
        '1': 'N1',
        '2': 'N2',
        '3': 'N3',
        '4': 'N4',
        '5': 'N5',
      }
      wordData = {
        level: levelMap[naverWord.level] || 'N5',
        kanji: naverWord.entry,
        onYomi: [],
        kunYomi: [],
        relatedWords: [],
      }
    }
  } else {
    // 네이버 단어가 없으면 한자 데이터에서 찾기
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
          {naverWord && (
            <div className="mb-6">
              <h1 className="text-display-l text-jp font-medium text-text-main mb-4">
                {naverWord.entry}
              </h1>
              
              {/* partsMeans 표시 */}
              {naverWord.partsMeans && naverWord.partsMeans.length > 0 && (
                <div className="space-y-4">
                  {naverWord.partsMeans.map((partMean, index) => (
                    <div key={index} className="border-b border-divider pb-4 last:border-b-0 last:pb-0">
                      {/* Part 뱃지 */}
                      {partMean.part && (
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-label font-medium text-text-sub bg-page rounded-md">
                            {partMean.part}
                          </span>
                        </div>
                      )}
                      
                      {/* Means 표시 */}
                      {partMean.means && partMean.means.length > 0 && (
                        <div className="space-y-1">
                          {partMean.means.map((mean, meanIndex) => (
                            <div key={meanIndex} className="text-body text-text-main">
                              {mean}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
