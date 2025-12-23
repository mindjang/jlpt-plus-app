'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth'
import { BottomSheet } from '@/components/ui/BottomSheet'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('이름을 입력해주세요.')
        }
        if (!phoneNumber.trim()) {
          throw new Error('휴대폰 번호를 입력해주세요.')
        }
        await signUpWithEmail(email, password, name, phoneNumber)
      } else {
        await signInWithEmail(email, password)
      }
      const next = searchParams.get('next')
      const safeNext = next && next.startsWith('/') ? next : '/home'
      router.replace(safeNext)
    } catch (err) {
      const error = err as { code?: string; message?: string }
      let errorMessage = error.message || '인증에 실패했습니다.'

      // Firebase 오류 메시지 한글화
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 인증이 활성화되지 않았습니다. Firebase Console에서 활성화해주세요.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.'
      } else if (error.code === 'auth/weak-password') {
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
      const next = searchParams.get('next')
      const safeNext = next && next.startsWith('/') ? next : '/home'
      router.replace(safeNext)
    } catch (err) {
      const error = err as { code?: string; message?: string }
      let errorMessage = error.message || 'Google 로그인에 실패했습니다.'

      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google 로그인이 활성화되지 않았습니다. Firebase Console에서 활성화해주세요.'
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인 창이 닫혔습니다.'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 이메일 폼이 표시되지 않으면 소셜 로그인 버튼들만 표시
  if (!showEmailForm && !isSignUp) {
    return (
      <>
        <div className="w-full max-w-lg mx-auto px-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-body">
              {error}
            </div>
          )}

          {/* 구글 로그인 버튼 */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-4 px-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold active:bg-gray-50 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글로 로그인하기
          </button>

          {/* 이메일 로그인 | 회원가입 버튼 */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setIsSignUp(false)
                setShowEmailForm(true)
              }}
              className="text-body text-text-sub active:opacity-70"
            >
              이메일 로그인
            </button>
            <span className="text-body text-text-sub">|</span>
            <button
              onClick={() => {
                setIsSignUp(true)
                setShowEmailForm(true)
              }}
              className="text-body text-text-sub active:opacity-70"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* 하단 시트 모달 */}
        <BottomSheet
          isOpen={showEmailForm}
          onClose={() => setShowEmailForm(false)}
          title={isSignUp ? '회원가입' : '이메일 로그인'}
        >
          <EmailAuthForm
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            loading={loading}
            error={error}
            onSubmit={handleEmailAuth}
            onClose={() => setShowEmailForm(false)}
          />
        </BottomSheet>
      </>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-body">
          {error}
        </div>
      )}

      {/* 구글 로그인 버튼 */}
      <button
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full py-4 px-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold active:bg-gray-50 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        구글로 로그인하기
      </button>

      {/* 이메일 로그인 | 회원가입 버튼 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setIsSignUp(false)
            setShowEmailForm(true)
          }}
          className="text-body text-text-sub active:opacity-70"
        >
          이메일 로그인
        </button>
        <span className="text-body text-text-sub">|</span>
        <button
          onClick={() => {
            setIsSignUp(true)
            setShowEmailForm(true)
          }}
          className="text-body text-text-sub active:opacity-70"
        >
          회원가입
        </button>
      </div>

      {/* 하단 시트 모달 */}
      <BottomSheet
        isOpen={showEmailForm}
        onClose={() => setShowEmailForm(false)}
        title={isSignUp ? '회원가입' : '이메일 로그인'}
      >
        <EmailAuthForm
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          name={name}
          setName={setName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          loading={loading}
          error={error}
          onSubmit={handleEmailAuth}
          onClose={() => setShowEmailForm(false)}
        />
      </BottomSheet>
    </div>
  )
}

/**
 * 이메일 인증 폼 컴포넌트 (하단 시트용)
 */
interface EmailAuthFormProps {
  isSignUp: boolean
  setIsSignUp: (value: boolean) => void
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  name: string
  setName: (value: string) => void
  phoneNumber: string
  setPhoneNumber: (value: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

function EmailAuthForm({
  isSignUp,
  setIsSignUp,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  phoneNumber,
  setPhoneNumber,
  loading,
  error,
  onSubmit,
  onClose,
}: EmailAuthFormProps) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-body">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-body text-text-main mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-body text-text-main mb-2">휴대폰 번호</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-body text-text-main mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-body text-text-main mb-2">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-primary text-white text-body font-semibold shadow-lg active:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? '처리 중...' : isSignUp ? '회원가입하기' : '로그인하기'}
        </button>
      </form>

      {/* 로그인/회원가입 전환 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setEmail('')
            setPassword('')
            setName('')
            setPhoneNumber('')
          }}
          className="text-sm text-text-sub active:opacity-70 transition-colors"
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </button>
      </div>
    </div>
  )
}

