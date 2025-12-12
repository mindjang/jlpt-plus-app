'use client'

import React, { useState, Suspense, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudySession } from '@/components/study/StudySession'
import { LoginForm } from '@/components/auth/LoginForm'
import { AppBar } from '@/components/ui/AppBar'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { convertNaverWordToWord, convertKanjiAliveEntryToKanji } from '@/lib/utils/dataConverter'
import type { Word, Kanji, JlptLevel } from '@/lib/types/content'
import { Level } from '@/data'

function LearnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const levelParam = searchParams.get('level') || 'n5'
  const typeParam = searchParams.get('type') || 'word'
  const limitParam = searchParams.get('limit')
  const doneParam = searchParams.get('done')
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<'example' | 'quiz'>('example')
  const [studyTime, setStudyTime] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [isStudyStarted, setIsStudyStarted] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  // 나가기 확인 후에는 뒤로가기 가드를 해제하기 위한 플래그
  const [allowNavigation, setAllowNavigation] = useState(false)

  // 기본 복귀 경로 (진입 전 페이지인 acquire로 안내)
  const defaultReturn = () =>
    router.push(`/acquire/auto-study/${levelParam.toLowerCase()}?type=${typeParam}`)

  // 나가기 확정 이후에 가드 해제 -> 이동을 순서대로 실행
  useEffect(() => {
    if (!allowNavigation) return
    const nav = pendingNavigation || defaultReturn
    setPendingNavigation(null)
    nav()
  }, [allowNavigation, pendingNavigation, router, defaultReturn])

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isStudyStarted && !completed) {
        e.preventDefault()
        setPendingNavigation(() => router.back)
        setShowExitConfirm(true)
        // 히스토리에 다시 추가하여 뒤로가기 취소
        window.history.pushState(null, '', window.location.href)
      }
    }

    if (isStudyStarted && !completed && !allowNavigation) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isStudyStarted, completed, router, allowNavigation])

  const level = useMemo(() => {
    return levelParam.toUpperCase() as Level
  }, [levelParam])

  const dailyNewLimit = limitParam ? parseInt(limitParam, 10) : 20
  const initialCompleted = doneParam ? parseInt(doneParam, 10) || 0 : 0
  // 남은 카드만 큐에 담기도록 목표량 조정 (분모는 initialCompleted + remaining으로 유지)
  const remainingDailyLimit = Math.max(dailyNewLimit - initialCompleted, 0)

  // 실제 데이터를 Word/Kanji 타입으로 변환 (네이버 데이터 사용)
  const words: Word[] = useMemo(() => {
    if (typeParam !== 'word') return []
    const naverWords = getNaverWordsByLevel(level)
    console.log('[LearnPage] 네이버 단어 데이터 로드:', { level, count: naverWords.length })
    const converted = naverWords.map((naverWord, index) => 
      convertNaverWordToWord(naverWord, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
    )
    console.log('[LearnPage] 변환된 단어 수:', converted.length, '첫 번째 단어 ID:', converted[0]?.id)
    return converted
  }, [level, typeParam])

  const kanjis: Kanji[] = useMemo(() => {
    if (typeParam !== 'kanji') return []
    const kanjiEntries = getKanjiByLevel(level)
    console.log('[LearnPage] 한자 데이터 로드:', { level, count: kanjiEntries.length })
    const converted = kanjiEntries.map((entry, index) => 
      convertKanjiAliveEntryToKanji(entry, `${level}_K_${String(index + 1).padStart(4, '0')}`, level as JlptLevel)
    )
    console.log('[LearnPage] 변환된 한자 수:', converted.length)
    return converted
  }, [level, typeParam])

  if (loading) {
    return (
      <div className="w-full">
        <AppBar title={`${level} ${typeParam === 'word' ? '단어' : '한자'} 학습`} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-body text-text-sub">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  // 타이머 포맷 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleBack = () => {
    if (isStudyStarted && !completed && !allowNavigation) {
      setPendingNavigation(() => router.back)
      setShowExitConfirm(true)
    } else {
      defaultReturn()
    }
  }

  const handleConfirmExit = () => {
    // 사용자가 나가기를 확정하면 뒤로가기 가드를 해제한 뒤 이동한다.
    setAllowNavigation(true)
    setShowExitConfirm(false)
    if (!pendingNavigation) {
      setPendingNavigation(defaultReturn)
    }
  }

  return (
    <div className="w-full">
      {!completed && (
        <AppBar 
          title={`${level} ${typeParam === 'word' ? '단어' : '한자'} 학습`} 
          onBack={handleBack}
          rightAction={
            <div className="text-body text-text-main font-medium">
              {formatTime(studyTime)}
            </div>
          }
        />
      )}
      
      {/* 학습 세션 */}
      <StudySession
        level={level}
        words={words}
        kanjis={kanjis}
        mode={mode}
        dailyNewLimit={remainingDailyLimit}
        initialCompleted={initialCompleted}
        onTimeUpdate={setStudyTime}
        onCompleteChange={setCompleted}
        onStudyStarted={setIsStudyStarted}
      />

      {/* 학습 중 나가기 확인 모달 */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false)
          setPendingNavigation(null)
        }}
        onConfirm={handleConfirmExit}
        title="학습 중단"
        message="학습을 중단하시겠습니까? 지금까지의 진행 상황이 저장되지 않을 수 있습니다."
        confirmText="나가기"
        cancelText="계속 학습"
        confirmButtonColor="danger"
      />
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    }>
      <LearnContent />
    </Suspense>
  )
}

