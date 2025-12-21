'use client'

import { useState, Suspense, useMemo, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AppBar } from '@/components/ui/AppBar'
import { Level, levelData, getLevelGradient } from '@/data'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { useUserSettings } from '@/hooks/useUserSettings'
import type { KanjiAliveEntry, NaverWord } from '@/data/types'
import { useStudyProgress } from '@/hooks/useStudyProgress'
import { AutoStudyCard } from '@/components/study/AutoStudyCard'
import { StudyInfoCard } from '@/components/study/StudyInfoCard'
import { StudyTabNavigation } from '@/components/study/StudyTabNavigation'

function AutoStudyContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { settings, updateDailyNewLimit } = useUserSettings(user)
  const level = (params.level as string)?.toUpperCase() as Level || 'N5'
  const gradient = getLevelGradient(params.level as string)
  const data = levelData[level]
  
  const typeParam = searchParams.get('type')
  const tasteParam = searchParams.get('taste') // Guest taste mode
  const isTasteMode = tasteParam === 'true'
  
  // URL 파라미터로 탭 초기화 (useMemo로 동기화)
  const activeTab = useMemo(() => {
    return typeParam === 'kanji' ? 'kanji' : 'word'
  }, [typeParam])
  
  // 일일 학습 목표: Guest taste mode > 사용자 설정 > 기본값(20)
  // 사용자가 UI에서 변경할 수 있으므로 useState 사용
  const [targetAmount, setTargetAmount] = useState(() => {
    if (isTasteMode) return 5
    return settings?.dailyNewLimit || 20
  })
  
  // 사용자 설정이 변경되면 targetAmount 업데이트 (taste mode가 아닐 때만)
  useEffect(() => {
    if (!isTasteMode && settings?.dailyNewLimit) {
      setTargetAmount(settings.dailyNewLimit)
    }
  }, [settings?.dailyNewLimit, isTasteMode])
  
  // targetAmount 변경 핸들러: 사용자 설정도 함께 업데이트
  const handleTargetAmountChange = async (amount: number) => {
    setTargetAmount(amount)
    if (!isTasteMode && user) {
      try {
        await updateDailyNewLimit(amount)
      } catch (error) {
        console.error('Failed to update daily new limit:', error)
      }
    }
  }

  // 단어/한자 데이터 상태 (지연 로딩)
  const [words, setWords] = useState<NaverWord[]>([])
  const [kanjis, setKanjis] = useState<KanjiAliveEntry[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // 데이터 지연 로딩
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true)
      try {
        if (activeTab === 'word') {
          const { getNaverWordsByLevelAsync } = await import('@/data/words/index')
          const loadedWords = await getNaverWordsByLevelAsync(level)
          setWords(loadedWords)
          setKanjis([])
        } else {
          const { getKanjiByLevelAsync } = await import('@/data/kanji/index')
          const loadedKanjis = await getKanjiByLevelAsync(level)
          setKanjis(loadedKanjis)
          setWords([])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
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
    // 탭 변경 시 URL 업데이트
    router.push(`/acquire/auto-study/${params.level}?type=${tab}&mode=auto`)
  }

  const totalWords = activeTab === 'word' ? data.words : data.kanji
  // 세션 분모: 세션 시작 시 계산된 값 사용, 없으면 목표량
  const sessionTotal = sessionTotalFixed ?? targetAmount

  const handleAllWordsClick = () => {
    if (activeTab === 'word') {
      router.push(`/acquire/word?level=${level.toLowerCase()}`)
    } else {
      router.push(`/acquire/kanji?level=${level.toLowerCase()}`)
    }
  }


  // Show loading when switching tabs or data is loading
  if (dataLoading || (activeTab === 'word' && words.length === 0) || (activeTab === 'kanji' && kanjis.length === 0 && level !== 'N1')) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body text-text-sub">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
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
        title={isTasteMode ? '무료 체험 (맛보기)' : `${level} ${activeTab === 'word' ? '단어' : '한자'}`}
        onBack={() => window.location.href = isTasteMode ? '/home' : `/acquire`}
        className="bg-transparent border-none"
      />

      <div className="relative z-10 pb-20">
        {isTasteMode && (
          // Taste mode banner
          <div className="px-4 pt-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
              <h3 className="text-body font-semibold text-purple-900 mb-1 flex items-center gap-2">
                <span className="text-lg">👋</span> 무료 체험 중입니다
              </h3>
              <p className="text-label text-purple-700">
                {level} 단어 5개를 맛보기로 학습해보세요. 진행 상황은 저장되지 않습니다.
              </p>
              <button
                onClick={() => router.push(`/login?next=${encodeURIComponent(`/acquire/auto-study/${params.level}?${searchParams.toString()}`)}`)}
                className="mt-2.5 w-full py-3 bg-purple-600 text-white rounded-lg text-body font-bold active:opacity-90 shadow-sm"
              >
                로그인하고 진행 상황 저장하기
              </button>
            </div>
          </div>
        )}
        
        {/* 자동 학습 모드 */}
        <div className="px-4 pt-4 space-y-3">
          <AutoStudyCard
            level={level}
            activeTab={activeTab}
            studyRound={studyRound}
            targetAmount={isTasteMode ? 5 : targetAmount}
            sessionProgress={sessionProgress}
            sessionTotal={sessionTotal || (isTasteMode ? 5 : targetAmount)}
            newWords={newWords}
            reviewWords={reviewWords}
            nextReviewDays={nextReviewDays}
            gradient={gradient}
            loading={loading}
            onTargetAmountChange={handleTargetAmountChange}
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
      </div>

      {/* 하단 네비게이션 (taste mode에서는 숨김) */}
      {!isTasteMode && (
        <StudyTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
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

