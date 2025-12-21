'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { SearchBar } from '@/components/ui/SearchBar'
import { ListItem } from '@/components/ui/ListItem'
import {
  getNaverSearchResults,
  getSearchResults,
} from '@/data/words/index'
import type { NaverWord } from '@/data/types'

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
  const [results, setResults] = useState<Array<{
    level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
    word: string
    furigana?: string
    meaning: string
  }>>([])
  const [loading, setLoading] = useState(false)

  // Load results when tab or query changes
  useEffect(() => {
    const loadResults = async () => {
      setLoading(true)
      try {
        let allResults: Array<{
          level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
          word: string
          furigana?: string
          meaning: string
        }> = []

        if (activeTab === 'word') {
          // 네이버 데이터를 SearchResult 형식으로 변환
          const naverResults = await getNaverSearchResults(searchQuery)
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
          allResults = await getSearchResults(searchQuery)
        }

        if (!searchQuery && allResults.length > INITIAL_DISPLAY_LIMIT) {
          setResults(allResults.slice(0, INITIAL_DISPLAY_LIMIT))
        } else {
          setResults(allResults)
        }
      } catch (error) {
        console.error('Failed to load search results:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    loadResults()
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

  const totalCount = searchQuery ? results.length : null

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
              className={`flex-1 py-2 px-4 rounded-lg text-body font-medium ${
                activeTab === 'word'
                  ? 'bg-primary text-surface'
                  : 'bg-surface border border-divider text-text-main'
              }`}
            >
              <FontAwesomeIcon icon={faBook} className="mr-2" />
              단어
            </button>
            <button
              onClick={() => handleTabChange('kanji')}
              className={`flex-1 py-2 px-4 rounded-lg text-body font-medium ${
                activeTab === 'kanji'
                  ? 'bg-primary text-surface'
                  : 'bg-surface border border-divider text-text-main'
              }`}
            >
              <FontAwesomeIcon icon={faLanguage} className="mr-2" />
              한자
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
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
          <div className="flex">
            <button
              onClick={() => handleTabChange('word')}
              className="flex-1 flex flex-col items-center justify-center py-3.5 transition-all duration-300 relative group"
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 transition-all duration-300"
                  fill={activeTab === 'word' ? '#FF8C00' : 'none'}
                  stroke={activeTab === 'word' ? '#FF8C00' : '#9CA3AF'}
                  strokeWidth={activeTab === 'word' ? 2 : 1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                    opacity={activeTab === 'word' ? 1 : 0.6}
                  />
                </svg>
                {activeTab === 'word' && (
                  <div className="absolute inset-0 rounded-full blur-sm opacity-20" style={{ backgroundColor: '#FF8C00' }} />
                )}
              </div>
              <span className={`text-label transition-all duration-300 mt-1.5 ${
                activeTab === 'word' ? 'font-bold text-text-main' : 'text-text-sub'
              }`}>
                단어
              </span>
            </button>
            <button
              onClick={() => handleTabChange('kanji')}
              className="flex-1 flex flex-col items-center justify-center py-3.5 transition-all duration-300 relative group"
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 transition-all duration-300"
                  fill={activeTab === 'kanji' ? '#FF8C00' : 'none'}
                  stroke={activeTab === 'kanji' ? '#FF8C00' : '#9CA3AF'}
                  strokeWidth={activeTab === 'kanji' ? 2 : 1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 8.716 6.747M12 3a8.997 8.997 0 0 0-8.716 6.747M15.25 12a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0Z"
                    opacity={activeTab === 'kanji' ? 1 : 0.6}
                  />
                </svg>
                {activeTab === 'kanji' && (
                  <div className="absolute inset-0 rounded-full blur-sm opacity-20" style={{ backgroundColor: '#FF8C00' }} />
                )}
              </div>
              <span className={`text-label transition-all duration-300 mt-1.5 ${
                activeTab === 'kanji' ? 'font-bold text-text-main' : 'text-text-sub'
              }`}>
                한자
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
