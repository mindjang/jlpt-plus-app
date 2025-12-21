'use client'

import React, { Suspense, useMemo, useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { SearchBar } from '@/components/ui/SearchBar'
import { ListItem } from '@/components/ui/ListItem'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import type { NaverWord } from '@/data/types'
import { levels, Level, getLevelGradient } from '@/data'
import { useAuth } from '@/components/auth/AuthProvider'
import { useUserSettings } from '@/hooks/useUserSettings'
import { getAllCardIds } from '@/lib/firebase/firestore'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getFirstMeaning,
} from '@/lib/data/kanji/kanjiHelpers'

function NewWordsContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { settings } = useUserSettings(user)
  
  const levelParam = params.level as string
  const typeParam = searchParams.get('type') || 'word'
  const limitParam = searchParams.get('limit')
  
  const level: Level = useMemo(() => {
    if (levelParam) {
      const upperLevel = levelParam.toUpperCase() as Level
      if (levels.includes(upperLevel)) {
        return upperLevel
      }
    }
    return 'N5'
  }, [levelParam])

  // 일일 학습 목표: URL 파라미터 > 사용자 설정 > 기본값(20)
  const limit = useMemo(() => {
    if (limitParam) {
      return parseInt(limitParam, 10)
    }
    return settings?.dailyNewLimit || 20
  }, [limitParam, settings?.dailyNewLimit])
  const [searchQuery, setSearchQuery] = useState('')
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // 학습한 카드 ID 가져오기
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchLearnedIds = async () => {
      try {
        const ids = await getAllCardIds(user.uid)
        setLearnedIds(ids)
      } catch (error) {
        console.error('Failed to fetch learned card IDs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLearnedIds()
  }, [user])

  // 새 단어/한자 목록 가져오기
  const newItems = useMemo(() => {
    if (loading) return []

    let allItems: Array<{
      level: Level
      word: string
      furigana?: string
      meaning: string
    }> = []

    if (typeParam === 'word') {
      const naverWords = getNaverWordsByLevel(level)
      // 학습하지 않은 단어만 필터링하고 SearchResult 형식으로 변환
      allItems = naverWords
        .filter((w: NaverWord) => !learnedIds.has(w.entry))
        .map((w: NaverWord) => {
          // 첫 번째 part의 첫 번째 의미 사용
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
    } else {
      const kanjis = getKanjiByLevel(level)
      // KanjiAliveEntry를 SearchResult 형식으로 변환
      allItems = kanjis
        .filter((entry) => {
          const character = getKanjiCharacter(entry)
          return !learnedIds.has(character)
        })
        .map((entry) => {
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
    }

    // 검색어 필터링
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      allItems = allItems.filter(
        (item) =>
          item.word.includes(searchQuery) ||
          item.furigana?.toLowerCase().includes(lowerQuery) ||
          item.meaning.includes(searchQuery)
      )
    }

    // 목표 학습량만큼만 반환
    return allItems.slice(0, limit)
  }, [level, typeParam, learnedIds, searchQuery, limit, loading])

  const handleItemClick = (word: string) => {
    if (typeParam === 'word') {
      router.push(`/acquire/word/${encodeURIComponent(word)}`)
    } else {
      router.push(`/acquire/kanji/${encodeURIComponent(word)}`)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const gradient = getLevelGradient(levelParam)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 프리미엄 그라데이션 배경 (전체 화면) */}
      <div
        className="fixed inset-0 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 50%, ${gradient.from} 100%)`,
          opacity: 0.95,
        }}
      />
      
      {/* 장식용 원형 요소들 */}
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: gradient.to }} />
      <div className="absolute top-40 -left-20 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: gradient.from }} />

      <AppBar 
        title={`새 ${typeParam === 'word' ? '단어' : '한자'}`} 
        onBack={() => router.back()}
        className="bg-transparent border-none backdrop-blur-sm [&_h1]:text-text-main [&_h1]:font-semibold [&_h1]:text-subtitle [&_button_span]:text-text-main [&_button]:text-text-main"
      />
      
      <div className="relative z-10 pb-6">
        <div className="px-5 pt-6">
          {/* 검색바 */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder={typeParam === 'word' ? '단어 검색...' : '한자 검색...'}
            />
          </div>
          
          {/* 검색 결과 */}
          <div className="space-y-3 mt-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 w-12 h-12 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                  </div>
                  <div className="text-body text-text-sub font-medium">로딩 중...</div>
                </div>
              </div>
            ) : (
              <>
                {newItems.map((item, index) => (
                  <div
                    key={`${item.word}-${index}`}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ListItem
                      level={item.level}
                      word={item.word}
                      furigana={item.furigana}
                      meaning={item.meaning}
                      onClick={() => handleItemClick(item.word)}
                    />
                  </div>
                ))}
                {newItems.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-xl shadow-black/5">
                      <p className="text-body text-text-sub">
                        {searchQuery ? '검색 결과가 없습니다.' : '새로 학습할 단어가 없습니다.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewWordsPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <AppBar title="새 단어" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    }>
      <NewWordsContent />
    </Suspense>
  )
}

