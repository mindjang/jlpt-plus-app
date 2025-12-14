'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { AppBar } from '@/components/ui/AppBar'
import { LevelChip } from '@/components/ui/LevelChip'
import { ReportModal } from '@/components/study/ReportModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { getKanjiEntry, getKanjiLevel, searchKanji } from '@/data/kanji/index'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getRadical,
  getStrokeCount,
  getRelatedWords,
  getKanjiMeaning,
} from '@/lib/data/kanji/kanjiHelpers'
import { motion } from 'framer-motion'
import type { JlptLevel } from '@/lib/types/content'

export default function KanjiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const kanji = decodeURIComponent(params.id as string)
  const [kanjiEntry, setKanjiEntry] = useState<any>(null)
  const [level, setLevel] = useState<string>('N5')
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)
  const [showAllRelatedWords, setShowAllRelatedWords] = useState(false)

  // Load kanji data
  useEffect(() => {
    const loadKanji = async () => {
      setLoading(true)
      try {
        const entry = await getKanjiEntry(kanji)
        setKanjiEntry(entry)
        const kanjiLevel = await getKanjiLevel(kanji)
        setLevel(kanjiLevel || 'N5')
      } catch (error) {
        console.error('Failed to load kanji:', error)
      } finally {
        setLoading(false)
      }
    }
    loadKanji()
  }, [kanji])

  // 한자 구성 요소 (부수와 기본 구성) - hooks는 early return 전에 호출되어야 함
  const components = useMemo(() => {
    if (!kanjiEntry) return []
    
    const comps: Array<{ char: string; type: 'component' | 'radical'; meaning?: string }> = []
    const radical = getRadical(kanjiEntry)
    
    // 부수 추가
    if (radical) {
      comps.push({
        char: radical,
        type: 'radical',
        meaning: kanjiEntry.radical?.meaning?.korean || kanjiEntry.radical?.meaning?.english,
      })
    }
    
    // 한자를 구성하는 다른 요소들 (간단한 추정)
    // 실제로는 decomposition 데이터가 필요하지만, 일단 부수만 표시
    return comps
  }, [kanjiEntry])

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
          contentType: 'kanji',
          contentText: report.content,
          level: level as JlptLevel,
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">로딩 중...</div>
      </div>
    )
  }

  if (!kanjiEntry) {
    return (
      <div className="w-full">
        <AppBar
          title="한자 상세"
          onBack={() => router.back()}
        />
        <div className="p-4">
          <div className="bg-surface rounded-lg border border-divider p-6 text-center">
            <p className="text-body text-text-sub">한자를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const character = getKanjiCharacter(kanjiEntry)
  const onYomi = getOnYomi(kanjiEntry)
  const kunYomi = getKunYomi(kanjiEntry)
  const radical = getRadical(kanjiEntry)
  const strokeCount = getStrokeCount(kanjiEntry)
  const relatedWords = getRelatedWords(kanjiEntry, level)
  const meaning = getKanjiMeaning(kanjiEntry)

  // 유사 한자는 skip (성능 문제로 인해 비활성화)
  const similarKanji: any[] = []

  return (
    <div className="w-full">
      <AppBar
        title={character}
        onBack={() => router.back()}
      />

      <div className="p-4 space-y-4">
        {/* 상단 획순 버튼 */}
        {strokeCount && (
          <div className="flex justify-end">
            <button
              onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(kanji)}/stroke-order`)}
              className="px-4 py-2 rounded-lg bg-surface border border-divider text-body text-text-main font-medium active:bg-gray-50 flex items-center gap-2"
            >
              <span>{character} 획순</span>
              <span>›</span>
            </button>
          </div>
        )}

        {/* 한자 기본 정보 */}
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

          <div className="text-center mb-6">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-4">
              {character}
            </h1>
            <LevelChip level={level as any} />
            <div className="text-title text-text-main font-semibold mt-2">
              {meaning}
            </div>
          </div>

          {/* 음독/훈독 */}
          <div className="space-y-3 mb-6">
            {onYomi.length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">음독</span>
                <span className="text-label text-jp text-text-main">
                  {onYomi.join('、')}
                </span>
              </div>
            )}
            {kunYomi.length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">훈독</span>
                <span className="text-label text-jp text-text-main">
                  {kunYomi.join('、')}
                </span>
              </div>
            )}
            {radical && (
              <div>
                <span className="text-label text-text-sub mr-2">부수</span>
                <span className="text-label text-jp text-text-main">
                  {radical}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 한자 구성 */}
        {components.length > 0 && (
          <div className="bg-surface rounded-lg border border-divider p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              한자 구성
            </h3>
            <div className="space-y-2">
              {components.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-page border border-divider"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-subtitle text-jp font-medium text-text-main">
                      {comp.char}
                    </span>
                    {comp.meaning && (
                      <span className="text-label text-text-sub">{comp.meaning}</span>
                    )}
                  </div>
                  {comp.type === 'radical' && (
                    <span className="px-2 py-1 rounded-chip bg-chip-radical text-chip-text text-label text-xs">
                      부수
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 활용 단어 */}
        {relatedWords.length > 0 && (
          <div className="bg-surface rounded-lg border border-divider p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              활용 단어 ({relatedWords.length})
            </h3>
            <div className="space-y-2">
              {(showAllRelatedWords 
                ? relatedWords 
                : relatedWords.slice(0, 5)
              ).map((word, index) => (
                <motion.div
                  key={index}
                  className="bg-page rounded-lg p-4 border border-divider"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-subtitle text-jp font-medium text-text-main">
                      {word.word}
                    </span>
                    {word.furigana && (
                      <span className="text-label text-jp text-text-sub">
                        {word.furigana}
                      </span>
                    )}
                  </div>
                  <p className="text-body text-text-sub">{word.meaning}</p>
                </motion.div>
              ))}
            </div>
            {relatedWords.length > 5 && (
              <button
                onClick={() => setShowAllRelatedWords(!showAllRelatedWords)}
                className="w-full mt-4 py-3 px-4 rounded-lg bg-surface border border-divider text-body text-text-main font-medium active:bg-gray-50"
              >
                {showAllRelatedWords ? '접기' : `더보기 (${relatedWords.length - 5}개 더)`}
              </button>
            )}
          </div>
        )}

        {/* 유사 한자 */}
        {similarKanji.length > 0 && (
          <div className="bg-surface rounded-lg border border-divider p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              유사 한자 ({similarKanji.length})
            </h3>
            <div className="space-y-3">
              {similarKanji.map((item, index) => (
                <div
                  key={index}
                  className="bg-page rounded-lg p-4 border border-divider"
                  onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(item.character)}`)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-display-m text-jp font-medium text-text-main">
                      {item.character}
                    </span>
                    <LevelChip level={item.level} />
                    <span className="text-label text-text-main flex-1">
                      {item.meaning}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {item.onYomi && item.onYomi.length > 0 && (
                      <div>
                        <span className="text-label text-text-sub mr-2">음독</span>
                        <span className="text-label text-jp text-text-main">
                          {item.onYomi.join('、')}
                        </span>
                      </div>
                    )}
                    {item.kunYomi && item.kunYomi.length > 0 && (
                      <div>
                        <span className="text-label text-text-sub mr-2">훈독</span>
                        <span className="text-label text-jp text-text-main">
                          {item.kunYomi.join('、')}
                        </span>
                      </div>
                    )}
                    {item.radical && (
                      <div>
                        <span className="text-label text-text-sub mr-2">부수</span>
                        <span className="text-label text-jp text-text-main">
                          {item.radical}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 외부 링크 */}
        <div className="bg-surface rounded-lg border border-divider p-6">
          <h3 className="text-subtitle font-medium text-text-main mb-4">
            외부 링크
          </h3>
          <div className="flex gap-3">
            <a
              href={`https://dict.naver.com/search.nhn?query=${encodeURIComponent(kanji)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 rounded-lg bg-surface border border-divider text-body text-text-main font-medium text-center active:bg-gray-50 flex items-center justify-center gap-2"
            >
              <span>네이버 사전</span>
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="kanji"
        contentText={character}
        level={level as JlptLevel}
        onSubmit={handleSubmitReport}
      />
    </div>
  )
}
