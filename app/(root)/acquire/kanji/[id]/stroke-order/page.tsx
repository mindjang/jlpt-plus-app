'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelChip } from '@/components/ui/LevelChip'
import { getKanjiEntry, getKanjiLevel } from '@/data/kanji/index'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getRadical,
  getStrokeCount,
  getKanjiMeaning,
} from '@/lib/data/kanji/kanjiHelpers'

export default function KanjiStrokeOrderPage() {
  const router = useRouter()
  const params = useParams()
  const kanji = decodeURIComponent(params.id as string)

  const [kanjiEntry, setKanjiEntry] = useState<any>(null)
  const [level, setLevel] = useState<string>('N5')
  const [loading, setLoading] = useState(true)
  const [currentStroke, setCurrentStroke] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Load kanji data
  useEffect(() => {
    const loadKanji = async () => {
      setLoading(true)
      try {
        const entry = await getKanjiEntry(kanji)
        setKanjiEntry(entry)
        const kanjiLevel = await getKanjiLevel(kanji)
        setLevel(kanjiLevel || 'N5')
      } catch (error) {
        console.error('Failed to load kanji:', error)
      } finally {
        setLoading(false)
      }
    }
    loadKanji()
  }, [kanji])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-page flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">로딩 중...</div>
      </div>
    )
  }

  if (!kanjiEntry) {
    return (
      <div className="w-full">
        <AppBar
          title={`${kanji} 획순`}
          onBack={() => router.back()}
        />
        <div className="p-4">
          <div className="bg-surface rounded-card p-6 text-center">
            <p className="text-body text-text-sub">한자를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const character = getKanjiCharacter(kanjiEntry)
  const strokeCount = getStrokeCount(kanjiEntry) || 0
  const strokeImages = kanjiEntry.kanji?.strokes?.images || []
  const video = kanjiEntry.kanji?.video

  // 획순 애니메이션 재생
  useEffect(() => {
    if (isPlaying && strokeImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentStroke((prev) => {
          if (prev >= strokeImages.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 800) // 각 획마다 0.8초

      return () => clearInterval(interval)
    }
  }, [isPlaying, strokeImages.length])

  const handlePlay = () => {
    if (currentStroke >= strokeImages.length - 1) {
      setCurrentStroke(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentStroke(0)
    setIsPlaying(false)
  }

  const handleStrokeClick = (index: number) => {
    setCurrentStroke(index)
    setIsPlaying(false)
  }

  return (
    <div className="w-full">
      <AppBar
        title={`${character} 획순`}
        onBack={() => router.back()}
      />

      <div className="p-4 space-y-4">
        {/* 획순 애니메이션 섹션 */}
        <div className="bg-surface rounded-card p-6">
          <h3 className="text-subtitle font-medium text-text-main mb-4">
            획순 애니메이션
          </h3>
          
          {/* 애니메이션 캔버스 */}
          <div className="bg-page rounded-card p-8 mb-4 flex items-center justify-center min-h-[200px]">
            {strokeImages.length > 0 && currentStroke < strokeImages.length ? (
              <img
                src={strokeImages[currentStroke]}
                alt={`${character} stroke ${currentStroke + 1}`}
                className="max-w-full max-h-[200px]"
              />
            ) : (
              <div className="text-display-l text-jp text-text-sub">
                {character}
              </div>
            )}
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-divider hover:bg-page transition-colors"
            >
              <span className="text-body">↺</span>
            </button>
            <button
              onClick={handlePlay}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <span className="text-body">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button
              onClick={() => {
                if (currentStroke < strokeImages.length - 1) {
                  setCurrentStroke(currentStroke + 1)
                  setIsPlaying(false)
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-divider hover:bg-page transition-colors"
              disabled={currentStroke >= strokeImages.length - 1}
            >
              <span className="text-body">⏭</span>
            </button>
          </div>
        </div>

        {/* 획수 진행 상황 */}
        <div className="bg-surface rounded-card p-6">
          <h3 className="text-subtitle font-medium text-text-main mb-4">
            획수 {strokeCount}획
          </h3>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: strokeCount }).map((_, index) => {
              const strokeIndex = index + 1
              const isActive = strokeIndex <= currentStroke + 1
              
              return (
                <button
                  key={index}
                  onClick={() => handleStrokeClick(index)}
                  className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-card border-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-divider bg-page'
                  }`}
                >
                  {strokeImages[index] ? (
                    <img
                      src={strokeImages[index]}
                      alt={`Stroke ${strokeIndex}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-label text-text-sub">{strokeIndex}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 한자 상세 정보 */}
        <div className="bg-surface rounded-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-display-l text-jp font-medium text-text-main">
              {character}
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <LevelChip level={level as any} />
              </div>
              <div className="text-title text-text-main font-semibold">
                {getKanjiMeaning(kanjiEntry)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* 음독 */}
            {getOnYomi(kanjiEntry).length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">음독</span>
                <span className="text-label text-jp text-text-main">
                  {getOnYomi(kanjiEntry).join('、')}
                </span>
              </div>
            )}

            {/* 훈독 */}
            {getKunYomi(kanjiEntry).length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">훈독</span>
                <span className="text-label text-jp text-text-main">
                  {getKunYomi(kanjiEntry).join('、')}
                </span>
              </div>
            )}

            {/* 부수 */}
            {getRadical(kanjiEntry) && (
              <div>
                <span className="text-label text-text-sub mr-2">부수</span>
                <span className="text-label text-jp text-text-main">
                  {getRadical(kanjiEntry)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
