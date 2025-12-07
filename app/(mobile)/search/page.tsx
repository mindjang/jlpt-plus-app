'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { AppBar } from '@/components/ui/AppBar'
import { SearchBar } from '@/components/ui/SearchBar'
import { ListItem } from '@/components/ui/ListItem'
import { 
  getSearchResults, 
  getTotalWordCount,
  getKanjiSearchResults,
  getTotalKanjiCount
} from '@/data'

const INITIAL_DISPLAY_LIMIT = 50 // 검색어가 없을 때 초기 표시 개수 (성능 최적화)

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'word' | 'kanji'>('word')
  
  // 검색 결과를 useMemo로 메모이제이션하여 불필요한 재계산 방지
  // 검색어가 없을 때는 초기 제한된 수만 반환하여 성능 최적화
  const results = useMemo(() => {
    let allResults: Array<{
      level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'
      word: string
      furigana?: string
      meaning: string
    }> = []
    
    if (activeTab === 'word') {
      allResults = getSearchResults(searchQuery)
    } else {
      allResults = getKanjiSearchResults(searchQuery)
    }
    
    // 검색어가 없을 때는 초기 제한된 수만 반환 (성능 최적화)
    // 사용자가 검색어를 입력하면 전체 결과를 보여줌
    if (!searchQuery && allResults.length > INITIAL_DISPLAY_LIMIT) {
      return allResults.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    
    return allResults
  }, [activeTab, searchQuery])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTabChange = useCallback((tab: 'word' | 'kanji') => {
    setActiveTab(tab)
    setSearchQuery('') // 탭 변경 시 검색어 초기화
  }, [])

  const handleItemClick = useCallback((word: string) => {
    router.push(`/word/${encodeURIComponent(word)}`)
  }, [router])

  const totalCount = useMemo(() => {
    return activeTab === 'word'
      ? (searchQuery ? results.length : getTotalWordCount())
      : (searchQuery ? results.length : getTotalKanjiCount())
  }, [activeTab, searchQuery, results.length])

  return (
    <>
      <AppBar title="전체 검색" onBack={() => router.back()} />

      <div className="pb-20">
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
        <div className="px-4 pb-3">
          <p className="text-xs">
            총 {totalCount.toLocaleString()}{activeTab === 'word' ? '단어' : '한자'}
          </p>
        </div>

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
                  onClick={() => handleItemClick(item.word)}
                />
              ))}
              {!searchQuery && (
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
      </div>

      {/* 하단 네비게이션 */}
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
    </>
  )
}
