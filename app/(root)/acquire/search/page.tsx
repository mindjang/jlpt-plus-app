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

const INITIAL_DISPLAY_LIMIT = 50

export default function SearchPage() {
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
      allResults = getSearchResults(searchQuery)
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

  const handleItemClick = useCallback((item: { word: string; level: string }) => {
    if (activeTab === 'word') {
      router.push(`/acquire/word/${encodeURIComponent(item.word)}`)
    } else {
      router.push(`/acquire/kanji/${encodeURIComponent(item.word)}`)
    }
  }, [activeTab, router])

  return (
    <div className="w-full">
      <AppBar title="검색" onBack={() => router.back()} />
      
      <div className="p-4">
        <SearchBar onSearch={handleSearch} />
        
        {/* 탭 선택 */}
        <div className="flex gap-2 mt-4 mb-4">
          <button
            onClick={() => setActiveTab('word')}
            className={`flex-1 py-2 px-4 rounded-card text-body font-medium ${
              activeTab === 'word'
                ? 'bg-primary text-surface'
                : 'bg-surface border border-divider text-text-main'
            }`}
          >
            <FontAwesomeIcon icon={faBook} className="mr-2" />
            단어 ({getTotalWordCount()})
          </button>
          <button
            onClick={() => setActiveTab('kanji')}
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

        {/* 검색 결과 */}
        <div className="space-y-2">
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
        </div>
      </div>
    </div>
  )
}

