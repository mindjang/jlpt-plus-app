'use client'

import React, { Suspense, useMemo, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import { levels, Level } from '@/data'
import type { NaverWord } from '@/data/types'

function WordListContent() {
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

  const [naverWords, setNaverWords] = useState<NaverWord[]>([])

  useEffect(() => {
    let mounted = true
    getNaverWordsByLevelAsync(level)
      .then((naverWords) => {
        if (!mounted) return
        setNaverWords(naverWords)
      })
      .catch((err) => console.error('[WordListPage] Word load failed:', err))

    return () => { mounted = false }
  }, [level])

  const [displayCount, setDisplayCount] = useState(50)
  const ITEMS_PER_PAGE = 50

  const words = useMemo(() => {
    return naverWords.map((w: NaverWord) => {
      const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
        ? w.partsMeans[0].means[0]
        : ''
      const levelMap: Record<string, Level> = {
        '1': 'N1',
        '2': 'N2',
        '3': 'N3',
        '4': 'N4',
        '5': 'N5',
      }
      return {
        level: levelMap[w.level] || 'N5',
        word: w.entry,
        furigana: undefined,
        meaning: firstMean,
      }
    })
  }, [naverWords])

  // 필터링된 단어 중 현재 보여줄 만큼만 슬라이스
  const visibleWords = useMemo(() => {
    return words.slice(0, displayCount)
  }, [words, displayCount])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < words.length) {
          setDisplayCount((prev) => prev + ITEMS_PER_PAGE)
        }
      },
      { threshold: 1.0 }
    )

    const sentinel = document.getElementById('scroll-sentinel')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [displayCount, words.length])

  const handleItemClick = (word: string) => {
    router.push(`/acquire/word/${encodeURIComponent(word)}`)
  }

  return (
    <div className="w-full min-h-screen bg-page pb-12">
      <AppBar
        title={`${level} 단어`}
        onBack={() => window.location.href = `/acquire`}
      />

      <div className="px-5 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-label text-text-sub font-bold">
            총 <span className="text-text-main font-black">{words.length}</span>개의 단어
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-text-hint bg-white/50 px-2.5 py-1 rounded-full border border-divider">
            {Math.min(displayCount, words.length)} / {words.length}
          </div>
        </div>

        <div className="space-y-2.5">
          {visibleWords.map((item, index) => (
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

        {/* 무한 스크롤 감지용 센티넬 */}
        {displayCount < words.length && (
          <div id="scroll-sentinel" className="h-20 flex items-center justify-center mt-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!naverWords.length && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40 grayscale">
            <img src="/mask/mogu_magic.png" alt="" className="w-24 h-24 object-contain mb-4" />
            <p className="text-label font-bold text-text-sub">데이터를 불러오는 중입니다...</p>
          </div>
        )}

        {displayCount >= words.length && words.length > 0 && (
          <div className="mt-12 mb-6 flex flex-col items-center gap-4 opacity-10 select-none">
            <img src="/mask/mogu_magic.png" alt="" className="w-16 h-16 object-contain grayscale" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-sub">End of List</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WordListPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="단어" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <WordListContent />
    </Suspense>
  )
}

