'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ContentTable } from './ContentTable'
import { Level } from '@/data'
import { FileText, Type, BookOpen } from 'lucide-react'

const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

type ContentType = 'word' | 'kanji' | 'example'

export function AdminContentManager() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL에서 상태 읽기
  const levelParam = searchParams.get('level')
  const typeParam = searchParams.get('type')
  
  const selectedLevel = useMemo(() => {
    if (levelParam) {
      const upperLevel = levelParam.toUpperCase() as Level
      if (levels.includes(upperLevel)) {
        return upperLevel
      }
    }
    return 'N5' // 기본값
  }, [levelParam])
  
  const contentType = useMemo(() => {
    if (typeParam === 'kanji' || typeParam === 'example') {
      return typeParam as ContentType
    }
    return 'word' // 기본값
  }, [typeParam])
  
  // URL 업데이트 함수
  const updateLevel = (level: Level) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('level', level)
    params.set('page', '1') // 레벨 변경 시 페이지 초기화
    router.push(`/admin/content?${params.toString()}`)
  }
  
  const updateContentType = (type: ContentType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    params.set('page', '1') // 타입 변경 시 페이지 초기화
    router.push(`/admin/content?${params.toString()}`)
  }
  
  // 초기 URL 설정 (파라미터가 없을 때)
  useEffect(() => {
    if (!levelParam || !typeParam) {
      const params = new URLSearchParams()
      params.set('level', selectedLevel)
      params.set('type', contentType)
      params.set('page', '1')
      router.replace(`/admin/content?${params.toString()}`)
    }
  }, []) // 초기 마운트 시에만 실행

  const levelLabels: Record<Level, string> = {
    N5: '입문',
    N4: '기본',
    N3: '응용',
    N2: '심화',
    N1: '완성',
  }

  const contentTypeLabels: Record<ContentType, string> = {
    word: '단어',
    kanji: '한자',
    example: '예문',
  }

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-body">
        난이도와 콘텐츠 타입을 선택하여 관리하세요. 추가, 수정, 삭제가 가능합니다.
      </div>

      {/* 난이도 선택 */}
      <div>
        <h3 className="text-body font-semibold text-text-main mb-3">난이도 선택</h3>
        <div className="flex gap-2 flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => updateLevel(level)}
              className={`px-4 py-2 rounded-lg text-body font-medium transition-all border-2 ${
                selectedLevel === level
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-text-main border-divider hover:border-primary'
              }`}
            >
              <span className="font-bold">{level}</span>
              <span className="ml-2 text-label opacity-80">
                {levelLabels[level]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 타입 선택 */}
      <div>
        <h3 className="text-body font-semibold text-text-main mb-3">콘텐츠 타입 선택</h3>
        <div className="flex gap-2">
          <button
            onClick={() => updateContentType('word')}
            className={`px-6 py-3 rounded-lg text-body font-medium transition-all flex items-center gap-2 border-2 ${
              contentType === 'word'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-text-sub border-divider hover:border-primary hover:text-text-main'
            }`}
          >
            <FileText size={20} />
            단어
          </button>
          <button
            onClick={() => updateContentType('kanji')}
            className={`px-6 py-3 rounded-lg text-body font-medium transition-all flex items-center gap-2 border-2 ${
              contentType === 'kanji'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-text-sub border-divider hover:border-primary hover:text-text-main'
            }`}
          >
            <Type size={20} />
            한자
          </button>
          <button
            onClick={() => updateContentType('example')}
            className={`px-6 py-3 rounded-lg text-body font-medium transition-all flex items-center gap-2 border-2 ${
              contentType === 'example'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-text-sub border-divider hover:border-primary hover:text-text-main'
            }`}
          >
            <BookOpen size={20} />
            예문
          </button>
        </div>
      </div>

      {/* 선택 정보 표시 */}
      <div className="bg-surface rounded-lg shadow-soft p-4">
        <div className="flex items-center gap-2 text-body text-text-main">
          <span className="font-semibold">{selectedLevel}</span>
          <span className="text-text-sub">·</span>
          <span>{contentTypeLabels[contentType]}</span>
          <span className="text-text-sub">관리</span>
        </div>
      </div>

      {/* 테이블 표시 */}
      <ContentTable level={selectedLevel} type={contentType} />
    </div>
  )
}
