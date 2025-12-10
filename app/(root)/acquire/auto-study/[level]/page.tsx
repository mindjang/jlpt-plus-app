'use client'

import React, { useState, Suspense, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { Modal } from '@/components/ui/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'
import { Level, levelData, getLevelGradient } from '@/data'
import { getLevelProgress } from '@/lib/srs/studyQueue'
import { getTodayQueues } from '@/lib/srs/studyQueue'
import { getWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { convertSearchResultToWord, convertKanjiAliveEntryToKanji } from '@/lib/utils/dataConverter'
import {
  calculateProgressStats,
  calculateRoundProgress,
  calculateChapterProgress,
} from '@/lib/srs/progressCalculation'
import { nowAsMinutes, dayNumberToMinutes, minutesToDays } from '@/lib/srs/reviewCard'
import type { Word, Kanji } from '@/lib/types/content'
import { hexToRgba } from '@/lib/utils/colorUtils'
import { SemicircleProgress } from '@/components/ui/SemicircleProgress'

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
  
  // 진행률 데이터 상태
  const [currentProgress, setCurrentProgress] = useState(0)
  const [newWords, setNewWords] = useState(0)
  const [reviewWords, setReviewWords] = useState(0)
  const [longTermMemory, setLongTermMemory] = useState(0)
  const [sessionProgress, setSessionProgress] = useState(0) // 오늘 학습한 카드 수
  const [studyRound, setStudyRound] = useState(1) // 학습 회차
  const [nextReviewDays, setNextReviewDays] = useState<number | null>(null) // 가장 가까운 미래 복습일까지
  const [sessionTotalFixed, setSessionTotalFixed] = useState<number>(targetAmount) // 세션 분모 고정값
  const [loading, setLoading] = useState(true)
  const studyRoundRef = useRef(1) // studyRound의 최신 값을 추적
  const [chaptersData, setChaptersData] = useState<Array<{
    number: number
    totalWords: number
    longTermMemory: number
    learned: number
  }>>([])
  
  // URL 파라미터로 탭 및 모드 초기화 (useMemo로 동기화)
  const activeTab = useMemo(() => {
    return typeParam === 'kanji' ? 'kanji' : 'word'
  }, [typeParam])
  
  const studyMode = useMemo(() => {
    return modeParam === 'chapter' ? 'chapter' : 'auto'
  }, [modeParam])
  
  const handleTabChange = (tab: 'word' | 'kanji') => {
    // 탭 변경 시 URL 업데이트 (기존 mode 파라미터 유지)
    const mode = modeParam || 'auto'
    router.push(`/acquire/auto-study/${params.level}?type=${tab}&mode=${mode}`)
  }

  const totalWords = activeTab === 'word' ? data.words : data.kanji
  // 세션 분모: 세션 시작 시 계산된 값 사용, 없으면 목표량
  const sessionTotal = sessionTotalFixed ?? targetAmount

  // 목표량 / 탭 변경 시 분모 초기화
  useEffect(() => {
    setSessionTotalFixed(targetAmount)
  }, [targetAmount, activeTab])

  // 단어/한자 데이터 변환
  const words: Word[] = useMemo(() => {
    if (activeTab !== 'word') return []
    const searchResults = getWordsByLevel(level)
    return searchResults.map((result, index) => 
      convertSearchResultToWord(result, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
    )
  }, [level, activeTab])

  const kanjis: Kanji[] = useMemo(() => {
    if (activeTab !== 'kanji') return []
    const kanjiEntries = getKanjiByLevel(level)
    return kanjiEntries.map((entry, index) => 
      convertKanjiAliveEntryToKanji(entry, `${level}_K_${String(index + 1).padStart(4, '0')}`, level as JlptLevel)
    )
  }, [level, activeTab])

  // 진행률 데이터 로드 함수
  const loadProgress = useCallback(async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // 1. 학습한 카드 수 가져오기
        const progress = await getLevelProgress(
          user.uid,
          level,
          data.words,
          data.kanji
        )
        
        const learned = activeTab === 'word' ? progress.learnedWords : progress.learnedKanjis
        setCurrentProgress(learned)

        // 2. 장기 기억 카드 수 및 오늘 새로 학습한 카드 수 계산
        const { getCardsByLevel } = await import('@/lib/firebase/firestore')
        const levelCardsMap = await getCardsByLevel(user.uid, level)
        const levelCards = Array.from(levelCardsMap.values())
        
        // 진행률 통계 계산
        const progressStats = calculateProgressStats(levelCards, activeTab)
        setLongTermMemory(progressStats.longTermMemory)
        
        // 회차 진행률 계산
        const roundProgress = calculateRoundProgress(
          progressStats.todayNewStudied,
          targetAmount,
          studyRoundRef.current
        )
        
        // 학습 회차 업데이트
        setStudyRound((prev) => {
          const newRound = Math.max(prev, roundProgress.currentRound)
          studyRoundRef.current = newRound
          return newRound
        })
        
        // 현재 회차 진행률 설정
        setSessionProgress(roundProgress.currentRoundProgress)

        // 3. 새 카드/복습 카드 수 가져오기 (현재 회차를 구성하는 카드 수)
        const items = activeTab === 'word' ? words : kanjis
        let availableToday = 0
        if (items.length > 0) {
          const queues = await getTodayQueues(
            user.uid,
            level,
            words,
            kanjis,
            targetAmount // dailyNewLimit으로 사용
          )
          // 현재 회차를 구성하는 새 카드와 복습 카드 수
          setNewWords(queues.newCards.filter(c => c.type === activeTab).length)
          setReviewWords(queues.reviewCards.filter(c => c.type === activeTab).length)
          availableToday = queues.mixedQueue.length
        }

        // 세션 분모 고정 (최초 1회만 설정; 이후 감소하지 않도록 prev 유지)
        const remainingCards = Math.max(totalWords - learned, 0)
        const fallbackTotal = remainingCards > 0 ? Math.min(targetAmount, remainingCards) : targetAmount
        const initialFixed = availableToday > 0 ? Math.min(targetAmount, availableToday) : fallbackTotal
        setSessionTotalFixed((prev) => (prev === null ? initialFixed : prev))

        // 4. 미래 복습까지 남은 일수 계산 (오늘 due 제외)
        const nowMinutesLocal = nowAsMinutes()
        let minFutureDays: number | null = null
        levelCards.forEach((card) => {
          if (card.type === activeTab) {
            const dueMinutes = card.due < 10000 ? dayNumberToMinutes(card.due) : card.due
            const diff = dueMinutes - nowMinutesLocal
            if (diff > 0) {
              const days = minutesToDays(diff)
              if (minFutureDays === null || days < minFutureDays) {
                minFutureDays = days
              }
            }
          }
        })
        setNextReviewDays(minFutureDays)

        // 5. 챕터별 진행률 계산
        const totalChapters = Math.ceil(totalWords / targetAmount)
        const chaptersProgress: Array<{
          number: number
          totalWords: number
          longTermMemory: number
          learned: number
        }> = []

        for (let i = 0; i < totalChapters; i++) {
          const startIndex = i * targetAmount
          const endIndex = Math.min(startIndex + targetAmount, items.length)
          const chapterItems = items.slice(startIndex, endIndex)
          const chapterCardIds = new Set(chapterItems.map(item => item.id))

          const chapterProgress = calculateChapterProgress(
            levelCards,
            chapterCardIds,
            activeTab
          )

          chaptersProgress.push({
            number: i + 1,
            totalWords: chapterItems.length,
            longTermMemory: chapterProgress.longTermMemory,
            learned: chapterProgress.learned,
          })
        }

        setChaptersData(chaptersProgress)
      } catch (error) {
        console.error('진행률 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }, [user, level, activeTab, targetAmount, words, kanjis, data.words, data.kanji, studyRound])

  // 진행률 데이터 로드
  useEffect(() => {
    loadProgress()
  }, [loadProgress])

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
    // 다음 회차로 넘어가기
    setStudyRound((prev) => {
      const newRound = prev + 1
      studyRoundRef.current = newRound
      return newRound
    })
    // 현재 회차 진행률 리셋
    setSessionProgress(0)
    // 데이터 다시 로드
    loadProgress()
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
            {/* 자동 학습 카드 */}
            <div className="bg-surface rounded-card p-4 shadow-soft flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-subtitle font-semibold text-text-main">자동 학습</h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
                    {studyRound}회차
                  </span>
                </div>
                <button 
                  onClick={() => router.push('/stats')}
                  className="text-body text-text-sub hover:text-text-main transition-colors"
                >
                  기록 &gt;
                </button>
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
                    {[5, 10, 15, 20, 25, 30, 35, 40].map((val) => (
                      <option key={val} value={val}>{val}개</option>
                    ))}
                  </select>
                </div>

                {/* 진행률 반원형 차트 */}
                <SemicircleProgress
                  value={loading ? 0 : sessionTotal === 0 ? 0 : Math.min((sessionProgress / sessionTotal) * 100, 100)}
                  progress={loading ? 0 : Math.min(sessionProgress, sessionTotal || targetAmount)}
                  total={sessionTotal || targetAmount}
                  color={gradient.to}
                  useChart={true}
                />
              </div>

              {/* 새 단어 / 복습 단어 */}
              <div className="flex flex-col gap-3">
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
                
                {/* 학습하기 버튼 */}
                <button
                  onClick={() =>
                    router.push(
                      `/practice/learn?level=${params.level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}`
                    )
                  }
                  className="w-full py-3 rounded-card bg-primary text-surface text-subtitle font-semibold"
                  disabled={sessionTotal === 0}
                >
                  {sessionTotal === 0
                    ? '학습할 카드가 없습니다'
                    : sessionProgress === 0
                      ? '학습하기'
                      : sessionProgress >= (sessionTotal || targetAmount)
                        ? `학습하기 (${Math.min(sessionProgress, sessionTotal || targetAmount)}/${sessionTotal || targetAmount})`
                        : `이어서 학습하기 (${Math.min(sessionProgress, sessionTotal || targetAmount)}/${sessionTotal || targetAmount})`}
                </button>
              </div>


              {/* 미래 복습 안내 */}
              {sessionTotal === 0 && nextReviewDays !== null && (
                <div className="text-body text-text-sub text-center mt-2">
                  다음 복습까지 약 {nextReviewDays}일 남았습니다.
                </div>
              )}
            </div>

            {/* 학습 정보 */}
            <div className="flex items-center justify-between">
              <h2 className="text-subtitle font-semibold text-text-main pl-2 pt-4">
                {level} 학습 정보
              </h2>
              <button 
                onClick={handleAllWordsClick}
                className="text-label text-text-sub"
              >
                모든 {activeTab === 'word' ? '단어' : '한자'} &gt;
              </button>
            </div>

            <div className="bg-surface rounded-card p-4 shadow-soft">
              {/* 장기 기억 단어/한자 */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2 items-center justify-between mb-1">
                  <span className="text-label text-text-sub">
                    장기 기억 {activeTab === 'word' ? '단어' : '한자'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-label text-text-sub font-medium">
                      {loading ? '...' : `${longTermMemory}/${totalWords}`}
                    </span>

                    <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((longTermMemory / totalWords) * 100, 0.5)}%`,
                          backgroundColor: hexToRgba(gradient.to, 0.3),
                          border: '1px solid #FF8A00',
                        }}
                      />
                      {longTermMemory === 0 && (
                        <div
                          className="absolute left-0 top-0 w-1 h-full rounded-full"
                          style={{
                            backgroundColor: hexToRgba(gradient.to, 0.3),
                            border: '1px solid #FF8A00',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
              </div>

              {/* 학습한 단어/한자 */}
              <div>
                <div className="grid grid-cols-2 gap-2 items-center justify-between mb-1">
                  <span className="text-label text-text-sub">
                    학습한 {activeTab === 'word' ? '단어' : '한자'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-label text-text-sub font-medium">
                      {loading ? '...' : `${currentProgress}/${totalWords}`}
                    </span>
                    <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((currentProgress / totalWords) * 100, 0.5)}%`,
                          backgroundColor: hexToRgba(gradient.to, 0.3),
                          border: '1px solid #FF8A00',
                        }}
                      />
                      {currentProgress === 0 && (
                        <div
                          className="absolute left-0 top-0 w-1 h-full rounded-full"
                          style={{
                            backgroundColor: hexToRgba(gradient.to, 0.3),
                            border: '1px solid #FF8A00',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body text-text-sub">장기 기억 단어</span>
                      <span className="text-body text-text-main font-medium">
                        {chapter.longTermMemory}/{chapter.totalWords}
                      </span>
                    </div>
                    <div className="h-2 bg-divider rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(chapter.longTermMemory / chapter.totalWords) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 학습한 단어 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body text-text-sub">학습한 단어</span>
                      <span className="text-body text-text-main font-medium">
                        {chapter.learned}/{chapter.totalWords}
                      </span>
                    </div>
                    <div className="h-2 bg-divider rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(chapter.learned / chapter.totalWords) * 100}%` }}
                      />
                    </div>
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
            onClick={() => handleTabChange('word')}
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
            onClick={() => handleTabChange('kanji')}
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

