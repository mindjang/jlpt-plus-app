'use client'

import React, { useState } from 'react'
import { ContentTable } from './ContentTable'
import { Level } from '@/data'

const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function AdminKanji() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)

  if (selectedLevel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-body text-text-sub hover:text-text-main mb-2"
            >
              ← 레벨 선택으로 돌아가기
            </button>
            <h2 className="text-subtitle font-semibold text-text-main">
              {selectedLevel} 한자 관리
            </h2>
          </div>
        </div>
        <ContentTable level={selectedLevel} type="kanji" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-body">
        레벨별 한자 목록을 관리할 수 있습니다. 한자를 추가, 수정, 삭제할 수 있습니다.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className="bg-surface rounded-lg p-6 shadow-soft hover:border-primary transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-subtitle font-semibold text-text-main">{level}</span>
              <span className="text-label text-text-sub bg-page px-2 py-1 rounded shadow-soft">
                {level === 'N5' ? '입문' : level === 'N4' ? '기본' : level === 'N3' ? '응용' : level === 'N2' ? '심화' : '완성'}
              </span>
            </div>
            <div className="text-body text-text-sub mt-4">
              한자 목록 관리
            </div>
            <div className="text-label text-text-sub mt-1">
              클릭하여 관리하기 →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
