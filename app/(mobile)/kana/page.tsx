'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { KanaGrid } from '@/components/ui/KanaGrid'
import { Modal } from '@/components/ui/Modal'
import { hiraganaCategories, katakanaCategories, KanaData, hiraganaSeionGroups, katakanaSeionGroups, KanaCategory } from '@/data/kana'

type KanaType = 'hiragana' | 'katakana'

export default function KanaPage() {
  const router = useRouter()
  const [kanaType, setKanaType] = useState<KanaType>('hiragana')
  const [selectedKana, setSelectedKana] = useState<KanaData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 히라가나와 가타카나 모두 모든 카테고리 표시
  const allCategories = kanaType === 'hiragana' ? hiraganaCategories : katakanaCategories
  const categories = allCategories

  const handleKanaClick = (item: KanaData) => {
    setSelectedKana(item)
    setIsModalOpen(true)
  }

  const getGridColumns = (category: string, categoryType: KanaCategory, items: KanaData[]): 3 | 4 | 5 => {
    if (category === '요음' || categoryType === 'yoon') return 3
    return 5
  }

  // 청음 그룹 아이템에 빈 칸을 사이에 삽입
  const processSeionGroup = (group: { items: KanaData[]; columns: 2 | 3 | 5 }): (KanaData | null)[] => {
    const { items, columns } = group
    
    if (columns === 3) {
      // ya, yu, yo: 사이사이에 공백
      // [ya] [빈칸] [yu] [빈칸] [yo]
      const result: (KanaData | null)[] = []
      items.forEach((item, index) => {
        result.push(item)
        if (index < items.length - 1) {
          result.push(null) // 사이에 빈 칸
        }
      })
      return result
    } else if (columns === 2) {
      // wa, wo: 사이에 3개 공백
      // [wa] [빈칸] [빈칸] [빈칸] [wo]
      const result: (KanaData | null)[] = []
      items.forEach((item, index) => {
        result.push(item)
        if (index < items.length - 1) {
          result.push(null, null, null) // 사이에 3개 빈 칸
        }
      })
      return result
    } else {
      // 5열인 경우 그대로 반환
      return items
    }
  }

  return (
    <>
      <AppBar 
        title="카나" 
        onBack={() => router.back()}
        rightAction={
          <button
            onClick={() => setKanaType(kanaType === 'katakana' ? 'hiragana' : 'katakana')}
            className="text-label font-medium transition-colors text-orange-500"
          >
            {kanaType === 'hiragana' ? '가타카나' : '히라가나'}
          </button>
        }
      />

      <div className="pb-8">
        <div className="space-y-6">
          {categories.map((categoryData) => (
            <div key={categoryData.category}>
              {/* 카테고리 헤더 */}
              <div className="px-4 py-1 bg-gray-100 mb-3">
                <h3 className="text-label font-semibold text-text-main">
                  {categoryData.name}
                </h3>
              </div>

              <div className="px-4">

              {/* 청음인 경우 여러 그룹으로 나누어 표시 */}
              {categoryData.category === 'seion' ? (
                <div className="space-y-4">
                  {(kanaType === 'hiragana' ? hiraganaSeionGroups : katakanaSeionGroups).map((group, groupIndex) => {
                    const processedItems = processSeionGroup(group)
                    const emptySlotIndices = processedItems
                      .map((item, idx) => item === null ? idx : -1)
                      .filter(idx => idx !== -1)
                    return (
                      <KanaGrid
                        key={groupIndex}
                        items={processedItems.filter((item): item is KanaData => item !== null)}
                        columns={5}
                        onItemClick={handleKanaClick}
                        emptySlots={emptySlotIndices}
                      />
                    )
                  })}
                </div>
              ) : (
                <KanaGrid
                  items={categoryData.items}
                  columns={getGridColumns(categoryData.name, categoryData.category, categoryData.items)}
                  onItemClick={handleKanaClick}
                />
              )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedKana?.kana}
      >
        {selectedKana && (
          <div className="text-center">
            <p className="text-display-s text-jp font-semibold text-text-main mb-4">
              {selectedKana.kana}
            </p>
            <p className="text-title text-text-sub mb-4">
              {selectedKana.romaji}
            </p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 px-4 rounded-lg bg-primary text-surface text-body font-medium active:opacity-80"
            >
              닫기
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
