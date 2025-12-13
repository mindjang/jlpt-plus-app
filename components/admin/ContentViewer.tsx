'use client'

import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import type { NaverWord } from '@/data/types'
// We need to import Level type but avoiding circular dependency or complex imports if possible
// Assuming Level is just 'N1' | 'N2' | ...
type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

interface ContentViewerProps {
  isOpen: boolean
  onClose: () => void
  level: string
  type: 'word' | 'kanji'
}

export function ContentViewer({ isOpen, onClose, level, type }: ContentViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const items = useMemo(() => {
    if (!isOpen) return []
    const lvl = level.toUpperCase() as Level
    if (type === 'word') {
      const allWords = getNaverWordsByLevel(lvl)
      return allWords.map((w: NaverWord, i: number) => {
        // 첫 번째 part의 첫 번째 의미 사용
        const firstMean = w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0
          ? w.partsMeans[0].means[0]
          : ''
        return {
        id: i,
          main: w.entry,
          sub: firstMean,
          extra: undefined // 네이버 데이터에는 furigana 정보가 없음
        }
      })
    } else {
      const allKanji = getKanjiByLevel(lvl)
      return allKanji.map((k: any, i: number) => ({
        id: i,
        main: k.ka_utf || k.kanji?.character,
        sub: k.meaning,
        extra: (k.onyomi_ja || k.onyomi || '') + ' / ' + (k.kunyomi_ja || k.kunyomi || '')
      }))
    }
  }, [isOpen, level, type])

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    const lower = searchTerm.toLowerCase()
    return items.filter(item =>
      item.main?.toLowerCase().includes(lower) ||
      item.sub?.toLowerCase().includes(lower)
    )
  }, [items, searchTerm])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${level} ${type === 'word' ? '단어' : '한자'} 목록 (총 ${items.length}개)`}>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="검색어 입력..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-divider rounded-card text-body"
        />

        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {filteredItems.slice(0, 100).map((item) => (
            <div key={item.id} className="p-3 bg-page border border-divider rounded-card flex justify-between items-center">
              <div>
                <div className="text-lg font-bold text-text-main">{item.main}</div>
                {item.extra && <div className="text-xs text-text-sub">{item.extra}</div>}
              </div>
              <div className="text-sm text-text-main text-right max-w-[50%]">
                {item.sub}
              </div>
            </div>
          ))}
          {filteredItems.length > 100 && (
            <div className="text-center text-xs text-text-sub py-2">
              ... 외 {filteredItems.length - 100}개 항목 (검색하여 확인하세요)
            </div>
          )}
          {filteredItems.length === 0 && (
            <div className="text-center text-body text-text-sub py-8">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        <div className="bg-yellow-50 text-orange-800 p-3 rounded text-xs">
          * 현재 콘텐츠는 파일 시스템에 저장되어 있어 관리자 페이지에서 직접 수정할 수 없습니다. 수정이 필요한 경우 개발자에게 문의하세요.
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-page border border-divider rounded-card text-body font-medium">닫기</button>
        </div>
      </div>
    </Modal>
  )
}
