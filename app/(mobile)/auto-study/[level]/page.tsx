'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { Modal } from '@/components/ui/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { Level, levelData, getLevelGradient } from '@/data'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { convertNaverWordToWord, convertKanjiAliveEntryToKanji } from '@/lib/utils/dataConverter'
import type { Word, Kanji } from '@/lib/types/content'
import { SemicircleProgress } from '@/components/ui/SemicircleProgress'
import { ProgressDisplay } from '@/components/ui/ProgressDisplay'
import { useStudyProgress } from '@/hooks/useStudyProgress'
import { useUserSettings } from '@/hooks/useUserSettings'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'

type StudyMode = 'auto' | 'chapter'

export default function AutoStudyPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { settings } = useUserSettings(user)
  const level = (params.level as string)?.toUpperCase() as Level || 'N5'
  const gradient = getLevelGradient(params.level as string)
  const data = levelData[level]
  
  const [studyMode, setStudyMode] = useState<StudyMode>('auto')
  const [showModeModal, setShowModeModal] = useState(false)
  const [targetAmount, setTargetAmount] = useState(20)
  const [activeTab, setActiveTab] = useState<'word' | 'kanji'>('word')

  // 사용자 설정 불러오면 기본 목표 적용
  useEffect(() => {
    if (settings?.dailyNewLimit) {
      setTargetAmount(settings.dailyNewLimit)
    }
  }, [settings.dailyNewLimit])

  // 단어/한자 데이터 변환 (네이버 데이터 사용)
  const words: Word[] = useMemo(() => {
    if (activeTab !== 'word') return []
    const naverWords = getNaverWordsByLevel(level)
    return naverWords.map((naverWord, index) => 
      convertNaverWordToWord(naverWord, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
    )
  }, [level, activeTab])

  const kanjis: Kanji[] = useMemo(() => {
    if (activeTab !== 'kanji') return []
    const kanjiEntries = getKanjiByLevel(level)
    return kanjiEntries.map((entry, index) => 
      convertKanjiAliveEntryToKanji(entry, `${level}_K_${String(index + 1).padStart(4, '0')}`, level)
    )
  }, [level, activeTab])

  // 진행률 데이터를 커스텀 훅으로 관리
  const {
    currentProgress,
    newWords,
    reviewWords,
    longTermMemory,
    sessionProgress,
    sessionTotalFixed,
    chaptersData,
    loading,
  } = useStudyProgress({
    uid: user?.uid || null,
    level,
    activeTab,
    words,
    kanjis,
    totalWords: activeTab === 'word' ? data.words : data.kanji,
    targetAmount,
    canLoad: !!user,
  })

  const totalWords = activeTab === 'word' ? data.words : data.kanji
  const sessionTotal = sessionTotalFixed ?? targetAmount

  // 챕터 계산 (각 챕터당 targetAmount개) - chaptersData가 있으면 사용, 없으면 기본값
  const totalChapters = Math.ceil(totalWords / targetAmount)
  const chapters = chaptersData.length > 0 
    ? chaptersData 
    : Array.from({ length: totalChapters }, (_, i) => ({
        number: i + 1,
        totalWords: i === totalChapters - 1 ? totalWords % targetAmount || targetAmount : targetAmount,
        longTermMemory: 0,
        learned: 0,
      }))

  const handleModeSelect = (mode: StudyMode) => {
    setStudyMode(mode)
    setShowModeModal(false)
  }

  return (
    <div className="min-h-screen relative bg-white">
      {/* 그라데이션 배경 (상단부터 40vh까지) */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '40vh',
          background: `linear-gradient(to bottom, ${gradient.to} 0%, ${gradient.from} 40%, #ffffff 60%)`,
        }}
      />

      <AppBar
        title={`${level} ${activeTab === 'word' ? '단어' : '한자'}`}
        onBack={() => router.back()}
        rightAction={
          <button
            onClick={() => setShowModeModal(true)}
            className="button-press w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="text-text-main" />
          </button>
        }
        className="bg-transparent border-none"
      />

      <div className="relative z-10 pb-20">
        {studyMode === 'auto' ? (
          // 자동 학습 모드
          <div className="px-4 pt-4 space-y-4">
            {/* 자동 학습 카드 */}
            <div className="bg-surface rounded-card p-4 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-subtitle font-semibold text-text-main">자동 학습</h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
                    1회차
                  </span>
                </div>
                <button className="text-body text-text-sub">기록 &gt;</button>
              </div>

              {/* 목표 학습량과 진행률 차트 */}
              <div className="grid grid-cols-2 gap-4 items-center justify-between">
                <div>
                  <span className="text-body text-text-sub block mb-2">목표 학습량</span>
                  <select
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="px-3 py-1.5 w-full rounded-md border border-divider bg-surface text-body text-text-main appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      paddingRight: '2.5rem',
                    }}
                  >
                    {AUTO_STUDY_TARGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}개
                      </option>
                    ))}
                  </select>
                </div>

                {/* 진행률 반원형 차트 */}
                <SemicircleProgress 
                  value={sessionTotal === 0 ? 0 : (sessionProgress / sessionTotal) * 100}
                  progress={sessionProgress}
                  total={sessionTotal}
                  color={gradient.from}
                />
              </div>

              {/* 새 단어 / 복습 단어 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-body text-text-sub">
                    새 {activeTab === 'word' ? '단어' : '한자'}
                  </span>
              <button 
                onClick={() => router.push(`/acquire/auto-study/${params.level}/new-words?type=${activeTab}&limit=${targetAmount}`)}
                className="text-body text-text-main font-medium"
              >
                {loading ? '...' : newWords} &gt;
              </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body text-text-sub">
                    복습 {activeTab === 'word' ? '단어' : '한자'}
                  </span>
              <button className="text-body text-text-main font-medium">
                {loading ? '...' : reviewWords} &gt;
              </button>
                </div>
              </div>

              {/* 학습하기 버튼 */}
              <button
                onClick={() =>
                  router.push(
                    `/practice/learn?level=${params.level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}`
                  )
                }
                className="w-full py-3 rounded-card bg-primary text-surface text-subtitle font-semibold"
              >
                {sessionProgress === 0 ? '학습하기' : '이어서 학습하기'}
              </button>
            </div>

            {/* 학습 정보 */}
            <div className="">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-subtitle font-semibold text-text-main">
                  {level} 학습 정보
                </h2>
              <button
                onClick={() => {
                  if (activeTab === 'word') {
                    router.push(`/acquire/word?level=${level.toLowerCase()}`)
                  } else {
                    router.push(`/acquire/kanji?level=${level.toLowerCase()}`)
                  }
                }}
                className="text-label text-text-sub"
              >
                모든 {activeTab === 'word' ? '단어' : '한자'} &gt;
              </button>
              </div>

              {/* 장기 기억 단어/한자 */}
              <div className="mb-3">
                <ProgressDisplay
                  current={loading ? 0 : longTermMemory}
                  total={totalWords}
                  color={gradient.to}
                  label={`장기 기억 ${activeTab === 'word' ? '단어' : '한자'}`}
                  labelPosition="left"
                  numberPosition="right"
                  showZeroIndicator
                />
              </div>

              {/* 학습한 단어/한자 */}
              <div>
                <ProgressDisplay
                  current={loading ? 0 : currentProgress}
                  total={totalWords}
                  color={gradient.to}
                  label={`학습한 ${activeTab === 'word' ? '단어' : '한자'}`}
                  labelPosition="left"
                  numberPosition="right"
                  showZeroIndicator
                />
              </div>
            </div>
          </div>
        ) : (
          // 챕터별 학습 모드
          <div className="px-4 pt-4 space-y-4">
            {/* 목표 학습량 */}
            <div className="flex items-center justify-between">
              <span className="text-body text-text-sub">목표 학습량</span>
              <select
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="px-3 py-1 rounded-md border border-divider bg-surface text-body text-text-main"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={30}>30개</option>
                <option value={50}>50개</option>
              </select>
            </div>

            {/* 챕터 리스트 */}
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.number}
                  className="bg-surface rounded-card p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
                          학습 대기 중
                        </span>
                      )}
                      <span className="text-subtitle font-semibold text-text-main">
                        챕터 {chapter.number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-label">
                        1회차
                      </span>
                    </div>
                    <span className="text-body text-text-sub">{chapter.totalWords}개</span>
                  </div>

                  {/* 장기 기억 단어 */}
                  <div className="mb-2">
                    <ProgressDisplay
                      current={chapter.longTermMemory}
                      total={chapter.totalWords}
                      color={gradient.to}
                      label="장기 기억 단어"
                      labelPosition="left"
                      numberPosition="right"
                    />
                  </div>

                  {/* 학습한 단어 */}
                  <div>
                    <ProgressDisplay
                      current={chapter.learned}
                      total={chapter.totalWords}
                      color={gradient.to}
                      label="학습한 단어"
                      labelPosition="left"
                      numberPosition="right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-surface border-t border-divider z-30">
        <div className="flex">
          <button
            onClick={() => setActiveTab('word')}
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
            onClick={() => setActiveTab('kanji')}
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

      {/* 모드 선택 모달 */}
      <Modal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
      >
        <div className="space-y-2">
          <button
            onClick={() => handleModeSelect('auto')}
            className="w-full text-left px-4 py-3 rounded-md hover:bg-page transition-colors text-body text-text-main"
          >
            자동 학습
          </button>
          <button
            onClick={() => handleModeSelect('chapter')}
            className="w-full text-left px-4 py-3 rounded-md hover:bg-page transition-colors text-body text-text-main"
          >
            챕터별 학습
          </button>
        </div>
      </Modal>
    </div>
  )
}
