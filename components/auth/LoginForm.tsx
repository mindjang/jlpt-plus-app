'use client'

import React, { useState } from 'react'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth'

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  // 테스트 계정 정보 (개발용)
  const [email, setEmail] = useState('test@jlpt-plus.app')
  const [password, setPassword] = useState('test123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: any) {
      let errorMessage = err.message || '인증에 실패했습니다.'
      
      // Firebase 오류 메시지 한글화
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 인증이 활성화되지 않았습니다. Firebase Console에서 활성화해주세요.'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. (최소 6자)'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err: any) {
      let errorMessage = err.message || 'Google 로그인에 실패했습니다.'
      
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google 로그인이 활성화되지 않았습니다. Firebase Console에서 활성화해주세요.'
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인 창이 닫혔습니다.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-surface rounded-card shadow-soft p-8">
        <h2 className="text-title font-semibold text-text-main mb-6 text-center">
          {isSignUp ? '회원가입' : '로그인'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-card text-body">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
          <div>
            <label className="block text-body text-text-main mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-card border border-divider bg-surface text-text-main"
            />
          </div>

          <div>
            <label className="block text-body text-text-main mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-card border border-divider bg-surface text-text-main"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button-press w-full py-3 px-4 rounded-card bg-primary text-surface text-body font-medium disabled:opacity-50"
          >
            {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-divider"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-sub">또는</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="button-press w-full py-3 px-4 rounded-card bg-surface border border-divider text-text-main text-body font-medium disabled:opacity-50"
        >
          Google로 로그인
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-body text-primary hover:underline"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}

