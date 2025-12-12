'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { SearchBar } from '@/components/ui/SearchBar'
import { ListItem } from '@/components/ui/ListItem'
import {
  getNaverSearchResults,
  getTotalNaverWordCount,
  getKanjiSearchResults,
  getTotalKanjiCount,
} from '@/data/words/index'
import type { NaverWord } from '@/data/words/index'

const INITIAL_DISPLAY_LIMIT = 50

interface SearchContentProps {
  /** 검색 결과 클릭 시 라우팅 방식 */
  routingMode?: 'root' | 'mobile'
  /** 탭 변경 시 검색어 초기화 여부 */
  resetOnTabChange?: boolean
  /** 총 개수 표시 여부 */
  showTotalCount?: boolean
  /** 하단 네비게이션 표시 여부 */
  showBottomNav?: boolean
  /** 검색어가 없을 때 안내 메시지 표시 여부 */
  showEmptyMessage?: boolean
}

export function SearchContent({
  routingMode = 'root',
  resetOnTabChange = false,
  showTotalCount = false,
  showBottomNav = false,
  showEmptyMessage = false,
}: SearchContentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'word' | 'kanji'>('word')

  const results = useMemo(() => {
    let allResults: Array<{
      level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
      word: string
      furigana?: string
      meaning: string
    }> = []

    if (activeTab === 'word') {
      // 네이버 데이터를 SearchResult 형식으로 변환
      const naverResults = getNaverSearchResults(searchQuery)
      allResults = naverResults.map((w: NaverWord) => {
        // 첫 번째 part의 첫 번째 의미 사용
        const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
          ? w.partsMeans[0].means[0]
          : ''
        const levelMap: Record<string, 'N1' | 'N2' | 'N3' | 'N4' | 'N5'> = {
          '1': 'N1',
          '2': 'N2',
          '3': 'N3',
          '4': 'N4',
          '5': 'N5',
        }
        return {
          level: levelMap[w.level] || 'N5',
          word: w.entry,
          furigana: undefined, // 네이버 데이터에는 furigana 정보가 없음
          meaning: firstMean,
        }
      })
    } else {
      allResults = getKanjiSearchResults(searchQuery)
    }

    if (!searchQuery && allResults.length > INITIAL_DISPLAY_LIMIT) {
      return allResults.slice(0, INITIAL_DISPLAY_LIMIT)
    }

    return allResults
  }, [activeTab, searchQuery])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTabChange = useCallback(
    (tab: 'word' | 'kanji') => {
      setActiveTab(tab)
      if (resetOnTabChange) {
        setSearchQuery('')
      }
    },
    [resetOnTabChange]
  )

  const handleItemClick = useCallback(
    (item: { word: string; level: string }) => {
      if (routingMode === 'root') {
        if (activeTab === 'word') {
          router.push(`/acquire/word/${encodeURIComponent(item.word)}`)
        } else {
          router.push(`/acquire/kanji/${encodeURIComponent(item.word)}`)
        }
      } else {
        router.push(`/word/${encodeURIComponent(item.word)}`)
      }
    },
    [activeTab, router, routingMode]
  )

  const totalCount = useMemo(() => {
    if (showTotalCount) {
      return activeTab === 'word'
        ? searchQuery
          ? results.length
          : getTotalNaverWordCount()
        : searchQuery
          ? results.length
          : getTotalKanjiCount()
    }
    return null
  }, [activeTab, searchQuery, results.length, showTotalCount])

  return (
    <>
      {/* 검색 바 */}
      <div className="px-4 pt-4 pb-3">
        <SearchBar
          placeholder={activeTab === 'word' ? '단어 검색...' : '한자 검색...'}
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
        />
      </div>

      {/* 총 단어/한자 수 */}
      {showTotalCount && totalCount !== null && (
        <div className="px-4 pb-3">
          <p className="text-xs">
            총 {totalCount.toLocaleString()}
            {activeTab === 'word' ? '단어' : '한자'}
          </p>
        </div>
      )}

      {/* 탭 선택 (하단 네비게이션이 없을 때만 표시) */}
      {!showBottomNav && (
        <div className="p-4 pt-0">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('word')}
              className={`flex-1 py-2 px-4 rounded-card text-body font-medium ${
                activeTab === 'word'
                  ? 'bg-primary text-surface'
                  : 'bg-surface border border-divider text-text-main'
              }`}
            >
              <FontAwesomeIcon icon={faBook} className="mr-2" />
              단어 ({getTotalNaverWordCount()})
            </button>
            <button
              onClick={() => handleTabChange('kanji')}
              className={`flex-1 py-2 px-4 rounded-card text-body font-medium ${
                activeTab === 'kanji'
                  ? 'bg-primary text-surface'
                  : 'bg-surface border border-divider text-text-main'
              }`}
            >
              <FontAwesomeIcon icon={faLanguage} className="mr-2" />
              한자 ({getTotalKanjiCount()})
            </button>
          </div>
        </div>
      )}

      {/* 검색 결과 리스트 */}
      <div className="bg-surface">
        {results.length > 0 ? (
          <>
            {results.map((item, index) => (
              <ListItem
                key={`${item.word}-${index}`}
                level={item.level}
                word={item.word}
                furigana={item.furigana}
                meaning={item.meaning}
                onClick={() => handleItemClick(item)}
              />
            ))}
            {showEmptyMessage && !searchQuery && (
              <div className="flex items-center justify-center py-4 border-t border-divider">
                <p className="text-label text-text-hint">
                  검색어를 입력하면 전체 결과를 볼 수 있습니다
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-body text-text-sub">
              {searchQuery ? '검색 결과가 없습니다' : '검색어를 입력하세요'}
            </p>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-surface border-t border-divider z-30">
          <div className="flex">
            <button
              onClick={() => handleTabChange('word')}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative ${
                activeTab === 'word' ? 'text-orange-500' : 'text-text-sub'
              }`}
            >
              <FontAwesomeIcon icon={faBook} className="text-[1.25rem] mb-1" />
              <span className="text-label">단어</span>
              {activeTab === 'word' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('kanji')}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative ${
                activeTab === 'kanji' ? 'text-orange-500' : 'text-text-sub'
              }`}
            >
              <FontAwesomeIcon icon={faLanguage} className="text-[1.25rem] mb-1" />
              <span className="text-label">한자</span>
              {activeTab === 'kanji' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
