'use client'

import React, { Suspense, useMemo, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { ListItem } from '@/components/ui/ListItem'
import { getKanjiByLevelAsync } from '@/data/kanji/index'
import { levels, Level } from '@/data'
import type { KanjiAliveEntry } from '@/data/types'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getFirstMeaning,
} from '@/lib/data/kanji/kanjiHelpers'

function KanjiListContent() {
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

  const [kanjiList, setKanjiList] = useState<KanjiAliveEntry[]>([])
  useEffect(() => {
    let mounted = true
    getKanjiByLevelAsync(level)
      .then((data) => { if (mounted) setKanjiList(data) })
      .catch((err) => console.error('[KanjiListPage] Kanji load failed:', err))
    return () => { mounted = false }
  }, [level])

  const handleItemClick = (kanji: string) => {
    router.push(`/acquire/kanji/${encodeURIComponent(kanji)}`)
  }

  const [displayCount, setDisplayCount] = useState(50)
  const ITEMS_PER_PAGE = 50

  // KanjiAliveEntry를 SearchResult 형식으로 변환
  const kanjiResults = useMemo(() => {
    return kanjiList.map((entry) => {
      const character = getKanjiCharacter(entry)
      const onYomi = getOnYomi(entry)
      const kunYomi = getKunYomi(entry)
      const meaning = getFirstMeaning(entry)
      const furigana = onYomi[0] || kunYomi[0] || undefined

      return {
        level,
        word: character,
        furigana,
        meaning,
      }
    })
  }, [kanjiList, level])

  const visibleKanjis = useMemo(() => {
    return kanjiResults.slice(0, displayCount)
  }, [kanjiResults, displayCount])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < kanjiResults.length) {
          setDisplayCount((prev) => prev + ITEMS_PER_PAGE)
        }
      },
      { threshold: 1.0 }
    )

    const sentinel = document.getElementById('kanji-scroll-sentinel')
    if (sentinel) observer.observe(sentinel)

    return () => observer.disconnect()
  }, [displayCount, kanjiResults.length])

  return (
    <div className="w-full min-h-screen bg-page pb-12">
      <AppBar
        title={`${level} 한자`}
        onBack={() => window.location.href = `/acquire`}
      />

      <div className="px-5 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-label text-text-sub font-bold">
            총 <span className="text-text-main font-black">{kanjiResults.length}</span>개의 한자
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-text-hint bg-white/50 px-2.5 py-1 rounded-full border border-divider">
            {Math.min(displayCount, kanjiResults.length)} / {kanjiResults.length}
          </div>
        </div>

        <div className="space-y-2">
          {visibleKanjis.map((item, index) => (
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
        {displayCount < kanjiResults.length && (
          <div id="kanji-scroll-sentinel" className="h-20 flex items-center justify-center mt-4">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!kanjiList.length && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40 grayscale">
            <img src="/mask/mogu_magic.png" alt="" className="w-24 h-24 object-contain mb-4" />
            <p className="text-label font-bold text-text-sub">데이터를 불러오는 중입니다...</p>
          </div>
        )}

        {displayCount >= kanjiResults.length && kanjiResults.length > 0 && (
          <div className="mt-12 mb-6 flex flex-col items-center gap-4 opacity-10 select-none">
            <img src="/mask/mogu_magic.png" alt="" className="w-16 h-16 object-contain grayscale" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-sub">End of List</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanjiListPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="한자" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <KanjiListContent />
    </Suspense>
  )
}

