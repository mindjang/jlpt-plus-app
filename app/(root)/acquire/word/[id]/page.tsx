'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelChip } from '@/components/ui/LevelChip'
import { findNaverWord } from '@/data/words/index'
import { getWordDetails } from '@/data/words/details/index'
import type { WordDetails, Level } from '@/data/types'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const word = decodeURIComponent(params.id as string)
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null)
  const [loading, setLoading] = useState(true)

  // 네이버 단어 데이터에서 찾기
  const naverWord = findNaverWord(word)

  // 레벨 매핑
  const levelMap: Record<string, Level> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  const jlptLevel = naverWord ? (levelMap[naverWord.level] || 'N5') : 'N5'

  // WordDetails 로드
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      try {
        const details = await getWordDetails(word, jlptLevel)
        setWordDetails(details)
      } catch (error) {
        console.error('[WordDetailPage] Error loading word details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [word, jlptLevel])

  // 첫 번째 단어 정보 (우선순위가 높은 것)
  const primaryWord = wordDetails?.words?.[0]
  const kanjiText = primaryWord?.expKanji || naverWord?.kanji || word
  const displayText = naverWord?.entry || word

  return (
    <div className="w-full">
      <AppBar title="단어 상세" onBack={() => router.back()} />

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* 스켈레톤: 단어 헤더 */}
            <div className="bg-surface rounded-card p-6 animate-pulse">
              <div className="text-center mb-4">
                <div className="h-12 w-24 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-3"></div>
                <div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
              </div>
              <div className="space-y-2 pt-4 border-t border-divider">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
            {/* 스켈레톤: 예문 */}
            <div className="bg-surface rounded-card p-6 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 단어 헤더 */}
            <div className="bg-surface rounded-card p-6">
              <div className="text-center mb-4">
                <h1 className="text-display-l text-jp font-medium text-text-main mb-2">
                  {kanjiText}
                </h1>
                <p className="text-title text-jp text-text-sub mb-3">{displayText}</p>
                {naverWord && (
                  <LevelChip level={levelMap[naverWord.level] || 'N5'} />
                )}
              </div>

              {/* 기본 의미 (NaverWord에서) */}
              {naverWord?.partsMeans && naverWord.partsMeans.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-divider">
                  {naverWord.partsMeans.map((partMean, index) => (
                    <div key={index}>
                      {partMean.part && (
                        <span className="inline-block px-2 py-1 text-label font-medium text-text-sub bg-page rounded-md mb-2">
                          {partMean.part}
                        </span>
                      )}
                      {partMean.means && partMean.means.length > 0 && (
                        <div className="space-y-1">
                          {partMean.means.map((mean, meanIndex) => (
                            <p key={meanIndex} className="text-body text-text-main">
                              {mean}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 다양한 한자 표기 및 의미 */}
            {wordDetails?.words && wordDetails.words.length > 1 && (
              <div className="bg-surface rounded-card p-6">
                <h2 className="text-title font-semibold text-text-main mb-4">다양한 표기</h2>
                <div className="space-y-4">
                  {wordDetails.words.slice(1, 6).map((wordItem, index) => (
                    <div
                      key={index}
                      className="border-b border-divider pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-body text-jp font-medium text-text-main">
                          {wordItem.expKanji}
                        </span>
                        {wordItem.frequencyAdd && (
                          <span className="text-label text-text-sub bg-page px-2 py-0.5 rounded">
                            {wordItem.frequencyAdd}
                          </span>
                        )}
                      </div>
                      {wordItem.meansCollector && wordItem.meansCollector.length > 0 && (
                        <div className="space-y-2">
                          {wordItem.meansCollector.map((collector, colIndex) => (
                            <div key={colIndex}>
                              {collector.partOfSpeech && (
                                <span className="text-label text-text-sub bg-page px-2 py-0.5 rounded mr-2">
                                  {collector.partOfSpeech}
                                </span>
                              )}
                              {collector.means && collector.means.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {collector.means.map((mean, meanIndex) => (
                                    <p
                                      key={meanIndex}
                                      className="text-body text-text-main"
                                      dangerouslySetInnerHTML={{ __html: mean.value }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 예문 */}
            {wordDetails?.examples && wordDetails.examples.length > 0 && (
              <div className="bg-surface rounded-card p-6">
                <h2 className="text-title font-semibold text-text-main mb-4">예문</h2>
                <div className="space-y-4">
                  {wordDetails.examples.slice(0, 5).map((example, index) => (
                    <div
                      key={index}
                      className="border-b border-divider pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="mb-2">
                        <p
                          className="text-body text-jp text-text-main leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: example.expExample1 }}
                        />
                      </div>
                      <div>
                        <p className="text-body text-text-sub">{example.expExample2}</p>
                      </div>
                      {example.expEntry && (
                        <div className="mt-2">
                          <span
                            className="text-label text-text-sub"
                            dangerouslySetInnerHTML={{ __html: example.expEntry }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 관련 단어 (hiraganaList) */}
            {wordDetails?.hiraganaList && wordDetails.hiraganaList.length > 0 && (
              <div className="bg-surface rounded-card p-6">
                <h2 className="text-title font-semibold text-text-main mb-4">관련 단어</h2>
                <div className="space-y-3">
                  {wordDetails.hiraganaList.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 border-b border-divider pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-body text-jp font-medium text-text-main">
                            {item.entry}
                          </span>
                          {item.pron && (
                            <span className="text-label text-jp text-text-sub">
                              {item.pron}
                            </span>
                          )}
                        </div>
                        {item.means && item.means.length > 0 && (
                          <p className="text-body text-text-sub">{item.means[0]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
