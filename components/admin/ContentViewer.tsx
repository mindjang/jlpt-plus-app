'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getCurrentUser } from '@/lib/firebase/auth'
import type { NaverWord, KanjiAliveEntry, Level } from '@/data/types'
import { ContentEditModal } from './ContentEditModal'

interface ContentViewerProps {
  isOpen: boolean
  onClose: () => void
  level: string
  type: 'word' | 'kanji'
}

interface ContentItem {
  id: string
  main: string
  sub: string
  extra?: string
  data: NaverWord | KanjiAliveEntry
}

export function ContentViewer({ isOpen, onClose, level, type }: ContentViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const lvl = level.toUpperCase() as Level

  // 콘텐츠 로드
  const loadContent = async () => {
    if (!isOpen) return
    
    setLoading(true)
    setError(null)
    
    try {
      const user = getCurrentUser()
      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      const token = await user.getIdToken()
      const endpoint = type === 'word' 
        ? `/api/admin/content/words?level=${lvl}`
        : `/api/admin/content/kanji?level=${lvl}`

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('콘텐츠를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      
      if (type === 'word') {
        const words = data.words as NaverWord[]
        setItems(words.map((w, i) => {
          const firstMean = w.partsMeans?.[0]?.means?.[0] || ''
          return {
            id: w.entry_id || `word-${i}`,
            main: w.entry,
            sub: firstMean,
            extra: w.kanji,
            data: w,
          }
        }))
      } else {
        const kanji = data.kanji as KanjiAliveEntry[]
        setItems(kanji.map((k, i) => {
          const character = k.ka_utf || k.kanji?.character || ''
          const meaning = k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning || ''
          const onyomi = k.kanji?.onyomi?.katakana || k.onyomi_ja || ''
          const kunyomi = k.kanji?.kunyomi?.hiragana || k.kunyomi_ja || ''
          return {
            id: k._id || `kanji-${i}`,
            main: character,
            sub: meaning,
            extra: onyomi && kunyomi ? `${onyomi} / ${kunyomi}` : onyomi || kunyomi,
            data: k,
          }
        }))
      }
    } catch (err) {
      console.error('Error loading content:', err)
      setError(err instanceof Error ? err.message : '콘텐츠를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadContent()
    }
  }, [isOpen, level, type])

  // 삭제 처리
  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`정말 삭제하시겠습니까?\n${item.main}`)) {
      return
    }

    setDeletingItemId(item.id)
    
    try {
      const user = getCurrentUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }

      const token = await user.getIdToken()
      const endpoint = type === 'word'
        ? `/api/admin/content/words?level=${lvl}&entryId=${(item.data as NaverWord).entry_id}`
        : `/api/admin/content/kanji?level=${lvl}&character=${encodeURIComponent(item.main)}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

      // 목록 새로고침
      await loadContent()
      alert('삭제되었습니다.')
    } catch (err) {
      console.error('Error deleting:', err)
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingItemId(null)
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    const lower = searchTerm.toLowerCase()
    return items.filter(item =>
      item.main?.toLowerCase().includes(lower) ||
      item.sub?.toLowerCase().includes(lower) ||
      item.extra?.toLowerCase().includes(lower)
    )
  }, [items, searchTerm])

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${level} ${type === 'word' ? '단어' : '한자'} 관리 (총 ${items.length}개)`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="검색어 입력..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 shadow-soft rounded-lg text-body"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-body font-medium active:bg-primary/90"
            >
              추가
            </button>
          </div>

          {loading && (
            <div className="text-center text-body text-text-sub py-8">
              로딩 중...
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded text-label">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {filteredItems.slice(0, 100).map((item) => (
                <div key={item.id} className="p-3 bg-page shadow-soft rounded-lg flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-subtitle font-semibold text-text-main">{item.main}</div>
                    {item.extra && <div className="text-label text-text-sub">{item.extra}</div>}
                    <div className="text-body text-text-main mt-1">{item.sub}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1.5 text-label bg-blue-50 text-blue-700 rounded active:bg-blue-100"
                      disabled={deletingItemId === item.id}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1.5 text-label bg-red-50 text-red-700 rounded active:bg-red-100"
                      disabled={deletingItemId === item.id}
                    >
                      {deletingItemId === item.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length > 100 && (
                <div className="text-center text-label text-text-sub py-2">
                  ... 외 {filteredItems.length - 100}개 항목 (검색하여 확인하세요)
                </div>
              )}
              {filteredItems.length === 0 && (
                <div className="text-center text-body text-text-sub py-8">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-4 py-3 bg-page shadow-soft rounded-lg text-body font-medium active:bg-gray-50">
              닫기
            </button>
          </div>
        </div>
      </Modal>

      {editingItem && (
        <ContentEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          level={lvl}
          type={type}
          item={editingItem.data}
          onSave={async () => {
            setEditingItem(null)
            await loadContent()
          }}
        />
      )}

      {showAddModal && (
        <ContentEditModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          level={lvl}
          type={type}
          onSave={async () => {
            setShowAddModal(false)
            await loadContent()
          }}
        />
      )}
    </>
  )
}
