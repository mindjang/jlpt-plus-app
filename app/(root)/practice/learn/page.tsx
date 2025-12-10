'use client'

import React, { useState, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudySession } from '@/components/study/StudySession'
import { LoginForm } from '@/components/auth/LoginForm'
import { AppBar } from '@/components/ui/AppBar'
import { getWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { convertSearchResultToWord, convertKanjiAliveEntryToKanji } from '@/lib/utils/dataConverter'
import type { Word, Kanji } from '@/lib/types/content'
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

  const level = useMemo(() => {
    return levelParam.toUpperCase() as Level
  }, [levelParam])

  const dailyNewLimit = limitParam ? parseInt(limitParam, 10) : 20
  const initialCompleted = doneParam ? parseInt(doneParam, 10) || 0 : 0
  // 남은 카드만 큐에 담기도록 목표량 조정 (분모는 initialCompleted + remaining으로 유지)
  const remainingDailyLimit = Math.max(dailyNewLimit - initialCompleted, 0)

  // 실제 데이터를 Word/Kanji 타입으로 변환
  const words: Word[] = useMemo(() => {
    if (typeParam !== 'word') return []
    const searchResults = getWordsByLevel(level)
    console.log('[LearnPage] 단어 데이터 로드:', { level, count: searchResults.length })
    const converted = searchResults.map((result, index) => 
      convertSearchResultToWord(result, `${level}_W_${String(index + 1).padStart(4, '0')}`, 1)
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

  return (
    <div className="w-full">
      {!completed && (
        <AppBar 
          title={`${level} ${typeParam === 'word' ? '단어' : '한자'} 학습`} 
          onBack={() => router.back()}
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

