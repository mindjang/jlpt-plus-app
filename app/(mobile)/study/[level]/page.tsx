'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudySession } from '@/components/study/StudySession'
import { LoginForm } from '@/components/auth/LoginForm'
import { signOutUser } from '@/lib/firebase/auth'

// 임시: 실제 데이터는 나중에 명세에 맞게 변환 필요
// 여기서는 예시로 빈 배열 사용
const mockWords: any[] = []
const mockKanjis: any[] = []

export default function StudyPage() {
  const params = useParams()
  const level = params.level as string
  const { user, loading } = useAuth()
  const [mode, setMode] = useState<'example' | 'quiz'>('example')

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
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-display-s font-semibold text-text-main">
            {level} 학습
          </h1>
          <button
            onClick={signOutUser}
            className="text-body text-text-sub hover:text-text-main"
          >
            로그아웃
          </button>
        </div>

        {/* 모드 선택 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('example')}
            className={`flex-1 py-2 px-4 rounded-card text-body font-medium ${
              mode === 'example'
                ? 'bg-primary text-surface'
                : 'bg-surface border border-divider text-text-main'
            }`}
          >
            예문 학습
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex-1 py-2 px-4 rounded-card text-body font-medium ${
              mode === 'quiz'
                ? 'bg-primary text-surface'
                : 'bg-surface border border-divider text-text-main'
            }`}
          >
            객관식 퀴즈
          </button>
        </div>

        {/* 학습 세션 */}
        <StudySession
          level={level}
          words={mockWords}
          kanjis={mockKanjis}
          mode={mode}
        />
      </div>
    </div>
  )
}

