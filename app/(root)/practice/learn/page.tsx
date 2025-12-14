'use client'

import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudySession, type StudySessionHandle } from '@/components/study/StudySession'
import { LoginRequiredScreen } from '@/components/auth/LoginRequiredScreen'
import { AppBar } from '@/components/ui/AppBar'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { useUserSettings } from '@/hooks/useUserSettings'
import { getUserData } from '@/lib/firebase/firestore'
import type { JlptLevel } from '@/lib/types/content'
import type { KanjiAliveEntry, NaverWord } from '@/data/types'
import { Level } from '@/data'

function LearnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const levelParam = searchParams.get('level') || 'n5'
  const typeParam = searchParams.get('type') || 'word'
  const limitParam = searchParams.get('limit')
  const doneParam = searchParams.get('done')
  const { user, loading } = useAuth()
  const { settings } = useUserSettings(user)
  const [mode, setMode] = useState<'example' | 'quiz'>('example')
  const [studyTime, setStudyTime] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [isStudyStarted, setIsStudyStarted] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
  // 나가기 확인 후에는 뒤로가기 가드를 해제하기 위한 플래그
  const [allowNavigation, setAllowNavigation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const studySessionExitRef = useRef<StudySessionHandle | null>(null)

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

  // 일일 학습 목표: URL 파라미터 > 사용자 설정 > 기본값(20) 순서로 우선순위
  const dailyNewLimit = useMemo(() => {
    if (limitParam) {
      return parseInt(limitParam, 10)
    }
    // 사용자 설정이 있으면 사용, 없으면 기본값 20
    return settings?.dailyNewLimit || 20
  }, [limitParam, settings?.dailyNewLimit])
  
  const initialCompleted = doneParam ? parseInt(doneParam, 10) || 0 : 0
  // 남은 카드만 큐에 담기도록 목표량 조정 (분모는 initialCompleted + remaining으로 유지)
  const remainingDailyLimit = Math.max(dailyNewLimit - initialCompleted, 0)

  // 실제 데이터를 NaverWord로 사용 (변환 없이 직접 사용)
  const words: NaverWord[] = useMemo(() => {
    if (typeParam !== 'word') return []
    const naverWords = getNaverWordsByLevel(level)
    console.log('[LearnPage] 네이버 단어 데이터 로드:', { level, count: naverWords.length })
    return naverWords
  }, [level, typeParam])

  const kanjis: KanjiAliveEntry[] = useMemo(() => {
    if (typeParam !== 'kanji') return []
    const kanjiEntries = getKanjiByLevel(level)
    console.log('[LearnPage] 한자 데이터 로드:', { level, count: kanjiEntries.length })
    return kanjiEntries
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
      <LoginRequiredScreen
        title={`${level} ${typeParam === 'word' ? '단어' : '한자'} 학습`}
        showBackButton
        onBack={() => router.push(`/acquire/auto-study/${levelParam.toLowerCase()}?type=${typeParam}`)}
        description="학습을 시작하려면\n로그인이 필요합니다."
      />
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

  const handleConfirmExit = async () => {
    setShowExitConfirm(false)
    setIsSaving(true)
    
    try {
      // StudySession의 데이터 저장 먼저 실행
      if (studySessionExitRef.current) {
        await studySessionExitRef.current.saveAndExit()
      }
    } catch (error) {
      console.error('Failed to save study data:', error)
    } finally {
      setIsSaving(false)
      // 저장 완료 후 이동
      setAllowNavigation(true)
      if (!pendingNavigation) {
        setPendingNavigation(defaultReturn)
      }
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
          className="bg-transparent border-none"
        />
      )}
      
      {/* 학습 세션 */}
      <StudySession
        ref={studySessionExitRef}
        level={level}
        words={words}
        kanjis={kanjis}
        mode={mode}
        dailyNewLimit={remainingDailyLimit}
        initialCompleted={initialCompleted}
        onTimeUpdate={setStudyTime}
        onCompleteChange={setCompleted}
        onStudyStarted={setIsStudyStarted}
        onCompleteClose={defaultReturn}
      />

      {/* 저장 중 로딩 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface rounded-lg border border-divider p-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-body text-text-main font-medium">데이터를 저장하는 중입니다...</p>
          </div>
        </div>
      )}

      {/* 학습 중 나가기 확인 모달 */}
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false)
          setPendingNavigation(null)
        }}
        onConfirm={handleConfirmExit}
        title="학습 중단"
        message="학습을 중단하시겠습니까?<br />지금까지의 진행 상황이 저장되지 않을 수 있습니다."
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

