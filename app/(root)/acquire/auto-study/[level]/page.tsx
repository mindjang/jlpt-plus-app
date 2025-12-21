'use client'

import { useState, Suspense, useMemo, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useMembership } from '@/components/membership/MembershipProvider'
import { AppBar } from '@/components/ui/AppBar'
import { Level, levelData, getLevelGradient } from '@/data'
import { useUserSettings } from '@/hooks/useUserSettings'
import type { KanjiAliveEntry, NaverWord } from '@/data/types'
import { useStudyProgress } from '@/hooks/useStudyProgress'
import { AutoStudyCard } from '@/components/study/AutoStudyCard'
import { StudyInfoCard } from '@/components/study/StudyInfoCard'

function AutoStudyContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { isMember } = useMembership()
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
  
  // targetAmount 변경 핸들러: 구독 회원만 변경 가능
  const handleTargetAmountChange = async (amount: number) => {
    // 구독 회원이 아니면 변경 불가
    if (!isMember && !isTasteMode) {
      router.push('/my?tab=membership')
      return
    }
    
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
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 w-16 h-16 border-4 border-gray-200 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-body text-text-sub font-medium">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 프리미엄 그라데이션 배경 (전체 화면) */}
      <div
        className="fixed inset-0 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 50%, ${gradient.from} 100%)`,
          opacity: 0.95,
        }}
      />
      
      {/* 장식용 원형 요소들 */}
      <div className="fixed top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: gradient.to }} />
      <div className="fixed top-40 -left-20 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: gradient.from }} />

      <AppBar
        title={isTasteMode ? '무료 체험 (맛보기)' : `${level} ${activeTab === 'word' ? '단어' : '한자'}`}
        onBack={() => window.location.href = isTasteMode ? '/home' : `/acquire`}
        className="bg-transparent border-none backdrop-blur-sm [&_h1]:text-text-main [&_h1]:font-semibold [&_h1]:text-subtitle [&_button_span]:text-text-main [&_button]:text-text-main"
      />

      <div className="relative z-10 pb-24">
        {isTasteMode && (
          <div className="px-5 pt-5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white/90 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-5 mb-4 shadow-lg shadow-purple-100/50">
              <h3 className="text-body font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <span className="text-xl">👋</span> 무료 체험 중입니다
              </h3>
              <p className="text-label text-purple-700 mb-4">
                {level} 단어 5개를 맛보기로 학습해보세요. 진행 상황은 저장되지 않습니다.
              </p>
              <button
                onClick={() => router.push(`/login?next=${encodeURIComponent(`/acquire/auto-study/${params.level}?${searchParams.toString()}`)}`)}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-body font-bold active:opacity-90 shadow-lg shadow-purple-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40"
              >
                로그인하고 진행 상황 저장하기
              </button>
            </div>
          </div>
        )}
        
        {/* 자동 학습 모드 */}
        <div className="px-5 pt-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
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
              canChangeTarget={isMember || isTasteMode}
            />
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 mt-6">
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
      </div>
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

