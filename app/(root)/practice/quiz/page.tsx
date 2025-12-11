'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudySession } from '@/components/study/StudySession'
import { LoginForm } from '@/components/auth/LoginForm'
import type { Word, Kanji } from '@/lib/types/content'

const mockWords: Word[] = []
const mockKanjis: Kanji[] = []

function QuizContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const level = searchParams.get('level') || 'n5'
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-body text-text-sub hover:text-text-main"
          >
            ← 뒤로
          </button>
          <h1 className="text-display-s font-semibold text-text-main">
            {level.toUpperCase()} 객관식 퀴즈
          </h1>
          <div className="w-12" />
        </div>

        <StudySession
          level={level.toUpperCase()}
          words={mockWords}
          kanjis={mockKanjis}
          mode="quiz"
        />
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}

