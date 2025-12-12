'use client'

import { useState, Suspense, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { Modal } from '@/components/ui/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { Level, levelData, getLevelGradient } from '@/data'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { convertNaverWordToWord, convertKanjiAliveEntryToKanji } from '@/lib/utils/dataConverter'
import type { Word, Kanji } from '@/lib/types/content'
import { useStudyProgress } from '@/hooks/useStudyProgress'
import { AutoStudyCard } from '@/components/study/AutoStudyCard'
import { StudyInfoCard } from '@/components/study/StudyInfoCard'
import { ChapterListSection } from '@/components/study/ChapterListSection'
import { StudyTabNavigation } from '@/components/study/StudyTabNavigation'

type StudyMode = 'auto' | 'chapter'

function AutoStudyContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const level = (params.level as string)?.toUpperCase() as Level || 'N5'
  const gradient = getLevelGradient(params.level as string)
  const data = levelData[level]
  
  const [showModeModal, setShowModeModal] = useState(false)
  const [targetAmount, setTargetAmount] = useState(20)
  const typeParam = searchParams.get('type')
  const modeParam = searchParams.get('mode')
  
  // URL 파라미터로 탭 및 모드 초기화 (useMemo로 동기화)
  const activeTab = useMemo(() => {
    return typeParam === 'kanji' ? 'kanji' : 'word'
  }, [typeParam])
  
  const studyMode = useMemo(() => {
    return modeParam === 'chapter' ? 'chapter' : 'auto'
  }, [modeParam])

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
      convertKanjiAliveEntryToKanji(entry, `${level}_K_${String(index + 1).padStart(4, '0')}`, level as Level)
    )
  }, [level, activeTab])

  // 진행률 데이터를 커스텀 훅으로 관리
  const {
    currentProgress,
    newWords,
    reviewWords,
    longTermMemory,
    sessionProgress,
    studyRound,
    nextReviewDays,
    sessionTotalFixed,
    chaptersData,
    loading,
    refresh: refreshProgress,
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
  
  const handleTabChange = (tab: 'word' | 'kanji') => {
    // 탭 변경 시 URL 업데이트 (기존 mode 파라미터 유지)
    const mode = modeParam || 'auto'
    router.push(`/acquire/auto-study/${params.level}?type=${tab}&mode=${mode}`)
  }

  const totalWords = activeTab === 'word' ? data.words : data.kanji
  // 세션 분모: 세션 시작 시 계산된 값 사용, 없으면 목표량
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
    setShowModeModal(false)
    // 모드 변경 시 URL 업데이트 (기존 type 파라미터 유지)
    const type = activeTab
    router.push(`/acquire/auto-study/${params.level}?type=${type}&mode=${mode}`)
  }

  const handleAllWordsClick = () => {
    if (activeTab === 'word') {
      router.push(`/acquire/word?level=${level.toLowerCase()}`)
    } else {
      router.push(`/acquire/kanji?level=${level.toLowerCase()}`)
    }
  }

  const handleNextRound = () => {
    // 다음 회차로 넘어가기 - useStudyProgress 훅에서 자동으로 처리됨
    // 진행률을 새로고침하여 최신 데이터 반영
    refreshProgress()
  }

  return (
    <div className="min-h-screen relative bg-white">
      {/* 그라데이션 배경 (상단부터 40vh까지) */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '40vh',
          background: `linear-gradient(to bottom, ${gradient.to} 0%, ${gradient.from} 80%, #ffffff 90%)`,
        }}
      />

      <AppBar
        title={`${level} ${activeTab === 'word' ? '단어' : '한자'}`}
        onBack={() => window.location.href = `/acquire`}
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
            <AutoStudyCard
              level={level}
              activeTab={activeTab}
              studyRound={studyRound}
              targetAmount={targetAmount}
              sessionProgress={sessionProgress}
              sessionTotal={sessionTotal || targetAmount}
              newWords={newWords}
              reviewWords={reviewWords}
              nextReviewDays={nextReviewDays}
              gradient={gradient}
              loading={loading}
              onTargetAmountChange={setTargetAmount}
            />
            
            <StudyInfoCard
              level={level}
              activeTab={activeTab}
              longTermMemory={longTermMemory}
              currentProgress={currentProgress}
              totalWords={totalWords}
              gradient={gradient}
              loading={loading}
              onAllWordsClick={handleAllWordsClick}
            />
          </div>
        ) : (
          // 챕터별 학습 모드
          <ChapterListSection
            activeTab={activeTab}
            targetAmount={targetAmount}
            chapters={chapters}
            gradient={gradient}
            onTargetAmountChange={setTargetAmount}
          />
        )}
      </div>

      {/* 하단 네비게이션 */}
      <StudyTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

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

export default function AutoStudyPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    }>
      <AutoStudyContent />
    </Suspense>
  )
}

