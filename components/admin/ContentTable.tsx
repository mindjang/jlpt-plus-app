'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/firebase/auth'
import type { NaverWord, KanjiAliveEntry, ExampleItem, Level } from '@/data/types'
import { ContentEditModal } from './ContentEditModal'

interface ContentTableProps {
  level: Level
  type: 'word' | 'kanji' | 'example'
}

interface ContentItem {
  id: string
  main: string
  sub: string
  extra?: string
  data: NaverWord | KanjiAliveEntry | { entry: string; example: ExampleItem }
}

export function ContentTable({ level, type }: ContentTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // URL에서 페이지 읽기
  const page = useMemo(() => {
    const pageParam = searchParams.get('page')
    const pageNum = pageParam ? parseInt(pageParam, 10) : 1
    return isNaN(pageNum) || pageNum < 1 ? 1 : pageNum
  }, [searchParams])
  
  const itemsPerPage = 50
  
  // 페이지 변경 함수
  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/admin/content?${params.toString()}`)
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 콘텐츠 로드
  const loadContent = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const user = getCurrentUser()
      let endpoint = ''
      if (type === 'word') {
        endpoint = `/api/admin/content/words?level=${level}`
      } else if (type === 'kanji') {
        endpoint = `/api/admin/content/kanji?level=${level}`
      } else if (type === 'example') {
        endpoint = `/api/admin/content/examples?level=${level}`
      }

      const headers: HeadersInit = {}
      if (user) {
        const token = await user.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(endpoint, { headers })

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
      } else if (type === 'kanji') {
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
      } else if (type === 'example') {
        const examples = data.examples as Array<{ entry: string; example: ExampleItem }> | undefined
        if (!examples || !Array.isArray(examples)) {
          console.error('Invalid examples data:', data)
          setItems([])
          return
        }
        
        const validItems = examples
          .filter((item) => {
            // 유효한 데이터만 필터링
            return item && 
                   typeof item === 'object' &&
                   item.example && 
                   typeof item.example === 'object' &&
                   item.entry && 
                   item.example.expExample1
          })
          .map((item, i) => {
            // 안전하게 접근
            const example = item.example!
            const japanese = example.expExample1?.replace(/<[^>]+>/g, '') || ''
            const korean = example.expExample2 || ''
            return {
              id: `${item.entry}-${example.rank || i}-${i}`,
              main: japanese,
              sub: korean,
              extra: item.entry, // 단어 entry
              data: item,
            }
          })
        
        setItems(validItems)
      }
    } catch (err) {
      console.error('Error loading content:', err)
      setError(err instanceof Error ? err.message : '콘텐츠를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [level, type])
  
  // 검색어 변경 시 페이지를 1로 리셋 (URL의 page가 1이 아닐 때만)
  useEffect(() => {
    if (searchTerm && page !== 1) {
      updatePage(1)
    }
  }, [searchTerm])

  // 삭제 처리
  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`정말 삭제하시겠습니까?\n${item.main}`)) {
      return
    }

    setDeletingItemId(item.id)
    
    try {
      const user = getCurrentUser()
      let endpoint = ''
      if (type === 'word') {
        endpoint = `/api/admin/content/words?level=${level}&entryId=${(item.data as NaverWord).entry_id}`
      } else if (type === 'kanji') {
        endpoint = `/api/admin/content/kanji?level=${level}&character=${encodeURIComponent(item.main)}`
      } else if (type === 'example') {
        const exampleData = item.data as { entry: string; example: ExampleItem }
        endpoint = `/api/admin/content/examples?level=${level}&entry=${encodeURIComponent(exampleData.entry)}&exampleRank=${exampleData.example.rank}`
      }

      const headers: HeadersInit = {}
      if (user) {
        const token = await user.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(endpoint, { 
        method: 'DELETE',
        headers 
      })

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.')
      }

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

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, page])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* 검색 및 추가 버튼 */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="검색어 입력..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              // 검색어 변경 시 페이지를 1로 리셋 (URL 업데이트는 useEffect에서 처리)
            }}
            className="flex-1 px-4 py-2 border border-divider rounded-lg text-body"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-body font-medium hover:bg-primary/90 transition-colors"
          >
            추가
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-label">
            {error}
          </div>
        )}

        {/* 통계 */}
        <div className="text-label text-text-sub">
          총 {filteredItems.length}개 항목 {searchTerm && `(검색 결과: ${filteredItems.length}개)`}
        </div>

        {/* 테이블 */}
        <div className="bg-surface rounded-lg border border-divider overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-page border-b border-divider">
                <tr>
                  <th className="text-left py-3 px-4 text-label font-semibold text-text-main">
                    {type === 'word' ? '단어' : type === 'kanji' ? '한자' : '일본어 예문'}
                  </th>
                  {type === 'word' && (
                    <th className="text-left py-3 px-4 text-label font-semibold text-text-main">한자</th>
                  )}
                  {type === 'example' && (
                    <th className="text-left py-3 px-4 text-label font-semibold text-text-main">단어</th>
                  )}
                  <th className="text-left py-3 px-4 text-label font-semibold text-text-main">
                    {type === 'example' ? '한국어 예문' : '의미'}
                  </th>
                  {type === 'kanji' && (
                    <th className="text-left py-3 px-4 text-label font-semibold text-text-main">음독/훈독</th>
                  )}
                  <th className="text-right py-3 px-4 text-label font-semibold text-text-main">작업</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-divider hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-body font-medium text-text-main">
                        {type === 'example' ? (
                          (() => {
                            const exampleData = item.data as { entry: string; example: ExampleItem } | undefined
                            const expExample1 = exampleData?.example?.expExample1
                            return expExample1 ? (
                              <span dangerouslySetInnerHTML={{ __html: expExample1 }} />
                            ) : (
                              <span>{item.main}</span>
                            )
                          })()
                        ) : (
                          item.main
                        )}
                      </div>
                    </td>
                    {type === 'word' && (
                      <td className="py-3 px-4 text-body text-text-sub">{item.extra || '-'}</td>
                    )}
                    {type === 'example' && (
                      <td className="py-3 px-4 text-body text-text-sub font-medium">{item.extra || '-'}</td>
                    )}
                    <td className="py-3 px-4 text-body text-text-main">{item.sub}</td>
                    {type === 'kanji' && (
                      <td className="py-3 px-4 text-body text-text-sub">{item.extra || '-'}</td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-3 py-1.5 text-label bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          disabled={deletingItemId === item.id}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="px-3 py-1.5 text-label bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                          disabled={deletingItemId === item.id}
                        >
                          {deletingItemId === item.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={type === 'word' ? 4 : type === 'kanji' ? 4 : type === 'example' ? 4 : 4} className="py-12 text-center text-body text-text-sub">
                      {searchTerm ? '검색 결과가 없습니다.' : '항목이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => updatePage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-divider rounded-lg text-body disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            <span className="text-body text-text-sub">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => updatePage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-divider rounded-lg text-body disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editingItem && (
        <ContentEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          level={level}
          type={type}
          item={editingItem.data}
          onSave={async () => {
            setEditingItem(null)
            await loadContent()
          }}
        />
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <ContentEditModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          level={level}
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
