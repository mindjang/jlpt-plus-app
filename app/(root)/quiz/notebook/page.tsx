'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { getWeakItems } from '@/lib/firebase/firestore/quiz'
import type { ItemStats } from '@/lib/types/quiz'
import type { JlptLevel } from '@/lib/types/content'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import { getKanjiByLevelAsync } from '@/data/kanji/index'
import { getKanjiCharacter, getOnYomi, getKunYomi, getFirstMeaning } from '@/lib/data/kanji/kanjiHelpers'
import type { NaverWord } from '@/data/types'
import { motion } from 'framer-motion'
import { BrandLoader } from '@/components/ui/BrandLoader'

export default function QuizNotebookPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>('N5')
  const [weakItems, setWeakItems] = useState<ItemStats[]>([])
  const [enrichedItems, setEnrichedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

  // 약점 데이터 로드
  useEffect(() => {
    if (user && selectedLevel) {
      loadWeakData()
    }
  }, [user, selectedLevel])

  const loadWeakData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. 약점 아이템 가져오기 (최대 50개)
      const items = await getWeakItems(user.uid, selectedLevel, 50)
      setWeakItems(items)

      // 2. 단어/한자 상세 정보 가져오기
      if (items.length > 0) {
        const [wordData, kanjiData] = await Promise.all([
          getNaverWordsByLevelAsync(selectedLevel as any),
          getKanjiByLevelAsync(selectedLevel as any)
        ])

        // 3. 데이터 매핑
        const enriched = items.map(item => {
          const itemValue = item.itemId.split(':')[1]

          if (item.itemType === 'word') {
            const wordInfo = wordData.find((w: NaverWord) => w.entry === itemValue)
            const meaning = wordInfo && wordInfo.partsMeans && wordInfo.partsMeans.length > 0 && wordInfo.partsMeans[0].means
              ? wordInfo.partsMeans[0].means[0]
              : '의미 정보 없음'

            return {
              ...item,
              word: itemValue,
              furigana: undefined, // NaverWord 데이터 구조에 따라 furigana가 없을 수 있음
              meaning: meaning,
              accuracy: item.accuracy
            }
          } else {
            // 한자
            const kanjiInfo = kanjiData.find((k: any) => getKanjiCharacter(k) === itemValue)
            let meaning = '의미 정보 없음'
            let furigana = undefined

            if (kanjiInfo) {
              meaning = getFirstMeaning(kanjiInfo)
              const onYomi = getOnYomi(kanjiInfo)
              const kunYomi = getKunYomi(kanjiInfo)
              furigana = onYomi[0] || kunYomi[0] || undefined
            }

            return {
              ...item,
              word: itemValue,
              furigana,
              meaning,
              accuracy: item.accuracy
            }
          }
        })

        setEnrichedItems(enriched)
      } else {
        setEnrichedItems([])
      }
    } catch (error) {
      console.error('[QuizNotebookPage] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-500'
    if (accuracy >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen text-body text-text-sub">로딩 중...</div>
  }

  if (!user) {
    return (
      <FeatureGuard
        feature="quiz_start"
        customMessage={{
          title: '나만의 단어장',
          description: '로그인이 필요한 기능입니다.',
        }}
      >
        <div />
      </FeatureGuard>
    )
  }

  return (
    <div className="w-full min-h-screen bg-page pb-12">
      <AppBar title="나만의 단어장" onBack={() => router.back()} />

      <div className="px-4 py-4 space-y-4">
        {/* 레벨 선택 탭 */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-full text-label font-bold whitespace-nowrap transition-all ${selectedLevel === level
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-text-sub border border-divider hover:bg-gray-50'
                }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* 설명 */}
        <div className="bg-surface p-4 rounded-xl border border-divider shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-body font-bold text-text-main">취약점 분석</h3>
              <p className="text-label text-text-sub mt-1">
                퀴즈에서 자주 틀린 단어들입니다. 정답률이 낮은 순서대로 최대 50개까지 표시됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 로딩 및 리스트 */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <BrandLoader />
          </div>
        ) : enrichedItems.length > 0 ? (
          <div className="space-y-3">
            {enrichedItems.map((item, index) => (
              <div key={`${item.itemId}-${index}`} className="flex items-center justify-between gap-2 relative group">
                <ListItem
                  level={selectedLevel}
                  word={item.word}
                  furigana={item.furigana}
                  meaning={item.meaning}
                  onClick={() => {
                    // 상세 페이지로 이동
                    if (item.itemType === 'word') {
                      router.push(`/acquire/word/${encodeURIComponent(item.word)}`)
                    } else {
                      router.push(`/acquire/kanji/${encodeURIComponent(item.word)}`)
                    }
                  }}
                />

                {/* 정답률 배지 */}
                <div className=" top-3 right-3 px-2 py-0.5 rounded-full bg-surface border border-divider shadow-sm text-[10px] font-bold z-10">
                  <span className={getAccuracyColor(item.accuracy)}>
                    {Math.round(item.accuracy * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-4 opacity-20 filter grayscale">
              <img src="/mask/mogu_magic.png" alt="" className="w-full h-full object-contain" />
            </div>
            <p className="text-body font-bold text-text-sub">
              아직 틀린 문제가 없어요!
            </p>
            <p className="text-label text-text-hint mt-1">
              퀴즈를 풀면 취약한 단어들이 이곳에 모입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
