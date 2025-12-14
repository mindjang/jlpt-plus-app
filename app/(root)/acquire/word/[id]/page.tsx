'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { AppBar } from '@/components/ui/AppBar'
import { LevelChip } from '@/components/ui/LevelChip'
import { ReportModal } from '@/components/study/ReportModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { findNaverWord } from '@/data/words/index'
import { getWordDetails } from '@/data/words/details/index'
import type { WordDetails, Level } from '@/data/types'

export default function WordDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const word = decodeURIComponent(params.id as string)
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [naverWord, setNaverWord] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [showAllRelatedWords, setShowAllRelatedWords] = useState(false)

  // 레벨 매핑
  const levelMap: Record<string, Level> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  const jlptLevel = naverWord ? (levelMap[naverWord.level] || 'N5') : 'N5'

  // 네이버 단어 데이터 및 WordDetails 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load naver word first
        const nWord = await findNaverWord(word)
        setNaverWord(nWord)
        
        // Then load word details
        const level = nWord ? (levelMap[nWord.level] || 'N5') : 'N5'
        const details = await getWordDetails(word, level)
        setWordDetails(details)
      } catch (error) {
        console.error('[WordDetailPage] Error loading word data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [word])

  // 첫 번째 단어 정보 (우선순위가 높은 것)
  const primaryWord = wordDetails?.words?.[0]
  const kanjiText = primaryWord?.expKanji || naverWord?.kanji || word
  const displayText = naverWord?.entry || word

  // 신고 제출 핸들러
  const handleSubmitReport = async (report: { content: string; reason: string }) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.')
    }

    setSubmittingReport(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'word',
          contentText: report.content,
          level: jlptLevel,
          reason: report.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '신고 제출에 실패했습니다.')
      }

      // 성공 시 모달 닫기
      setShowReportModal(false)
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <div className="w-full">
      <AppBar title="단어 상세" onBack={() => router.back()} />

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* 스켈레톤: 단어 헤더 */}
            <div className="bg-surface rounded-lg border border-divider p-6 animate-pulse">
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
            <div className="bg-surface rounded-lg border border-divider p-6 animate-pulse">
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
            <div className="bg-surface rounded-lg border border-divider p-6 relative">
              {/* 신고 버튼 */}
              <button
                onClick={() => setShowReportModal(true)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 border border-divider"
                title="신고하기"
              >
                <FontAwesomeIcon
                  icon={faFlag}
                  className="text-text-sub"
                  size="sm"
                />
              </button>

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
                  {naverWord.partsMeans.map((partMean: any, index: number) => (
                    <div key={index}>
                      {partMean.part && (
                        <span className="inline-block px-2 py-1 text-label font-medium text-text-sub bg-page rounded-md mb-2">
                          {partMean.part}
                        </span>
                      )}
                      {partMean.means && partMean.means.length > 0 && (
                        <div className="space-y-1">
                          {partMean.means.map((mean: string, meanIndex: number) => (
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
              <div className="bg-surface rounded-lg border border-divider p-6">
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
              <div className="bg-surface rounded-lg border border-divider p-6">
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
              <div className="bg-surface rounded-lg border border-divider p-6">
                <h2 className="text-title font-semibold text-text-main mb-4">
                  관련 단어 ({wordDetails.hiraganaList.length})
                </h2>
                <div className="space-y-3">
                  {(showAllRelatedWords 
                    ? wordDetails.hiraganaList 
                    : wordDetails.hiraganaList.slice(0, 5)
                  ).map((item, index) => (
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
                          <p className="text-body text-text-sub" dangerouslySetInnerHTML={{ __html: item.means[0] }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {wordDetails.hiraganaList.length > 5 && (
                  <button
                    onClick={() => setShowAllRelatedWords(!showAllRelatedWords)}
                    className="w-full mt-4 py-3 px-4 rounded-lg bg-surface border border-divider text-body text-text-main font-medium active:bg-gray-50"
                  >
                    {showAllRelatedWords ? '접기' : `더보기 (${wordDetails.hiraganaList.length - 5}개 더)`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="word"
        contentText={word}
        level={jlptLevel}
        onSubmit={handleSubmitReport}
      />
    </div>
  )
}
