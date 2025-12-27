'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { BrandLoader } from '@/components/ui/BrandLoader'
import { sendVerificationCode, verifyCode } from '@/lib/utils/emailVerification'

/**
 * 휴대폰 번호 포맷팅 함수 (010-1234-5678 형식)
 */
function formatPhoneNumber(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, '')
  
  // 11자리 초과 시 자르기
  const limited = numbers.slice(0, 11)
  
  // 포맷팅
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`
  }
}

type SignUpStep = 'email' | 'birthDate' | 'name' | 'password' | 'passwordConfirm' | 'complete'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('') // YYMMDD 형식
  const [birthDateLastDigit, setBirthDateLastDigit] = useState('') // 뒷자리 1자리 (성별)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  
  // 회원가입 단계 관리
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('email')
  const [verificationCode, setVerificationCode] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  
  // 포커스 관리를 위한 ref
  const birthDateInputRef = useRef<HTMLInputElement>(null)
  const birthDateLastDigitInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const passwordConfirmInputRef = useRef<HTMLInputElement>(null)

  // 생년월일 입력창이 나타나면 포커스
  useEffect(() => {
    if (signUpStep === 'birthDate' && birthDateInputRef.current) {
      setTimeout(() => {
        birthDateInputRef.current?.focus()
      }, 100)
    }
  }, [signUpStep])

  // 생년월일 뒷자리 입력창이 나타나면 포커스
  useEffect(() => {
    if (signUpStep === 'birthDate' && birthDate.length === 6 && birthDateLastDigitInputRef.current) {
      setTimeout(() => {
        birthDateLastDigitInputRef.current?.focus()
      }, 100)
    }
  }, [signUpStep, birthDate])

  // 이름 입력창이 나타나면 포커스
  useEffect(() => {
    if (signUpStep === 'name' && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [signUpStep])

  // 비밀번호 입력창이 나타나면 포커스
  useEffect(() => {
    if (signUpStep === 'password' && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current?.focus()
      }, 100)
    }
  }, [signUpStep])

  // 비밀번호 확인 입력창이 나타나면 포커스
  useEffect(() => {
    if (signUpStep === 'passwordConfirm' && passwordConfirmInputRef.current) {
      setTimeout(() => {
        passwordConfirmInputRef.current?.focus()
      }, 100)
    }
  }, [signUpStep])

  // 인증번호 발송
  const handleSendVerificationCode = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    setSendingCode(true)
    setError(null)

    try {
      await sendVerificationCode(email)
      setError(null)
      // 성공 메시지는 UI에서 표시
    } catch (err) {
      setError('인증번호 발송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSendingCode(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증번호를 입력해주세요.')
      return
    }

    setVerifyingCode(true)
    setError(null)

    try {
      const isValid = await verifyCode(email, verificationCode)
      if (isValid) {
        setIsEmailVerified(true)
        setError(null)
        // 다음 단계로 자동 이동
        setSignUpStep('birthDate')
      } else {
        setError('인증번호가 올바르지 않습니다.')
      }
    } catch (err) {
      setError('인증번호 확인에 실패했습니다.')
    } finally {
      setVerifyingCode(false)
    }
  }

  // 생년월일 입력 완료 시 자동으로 다음 단계로 이동
  useEffect(() => {
    if (signUpStep === 'birthDate' && birthDate.length === 6 && birthDateLastDigit.length === 1) {
      // 생년월일 6자리 + 뒷자리 1자리 입력 완료 시 자동으로 이름 입력창으로 이동
      setError(null)
      setSignUpStep('name')
    }
  }, [signUpStep, birthDate, birthDateLastDigit])

  // 이름 입력 후 다음 버튼 클릭 시 비밀번호 입력 단계로 이동
  const handlePasswordNext = () => {
    // 이름 입력 단계에서 호출된 경우
    if (signUpStep === 'name') {
      if (!name.trim()) {
        setError('이름을 입력해주세요.')
        return
      }
      setError(null)
      setSignUpStep('passwordConfirm')
      return
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // 비밀번호 확인
        if (password !== passwordConfirm) {
          throw new Error('비밀번호가 일치하지 않습니다.')
        }
        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        }
        
        // 이메일 인증 확인
        if (!isEmailVerified) {
          throw new Error('이메일 인증을 완료해주세요.')
        }

        // 생년월일 형식 변환 (YYMMDD + 뒷자리 1자리 → YYYY-MM-DD)
        // 뒷자리 1자리가 1,2면 1900년대, 3,4면 2000년대
        let fullBirthDate = ''
        if (birthDate.length === 6 && birthDateLastDigit.length === 1) {
          const year = parseInt(birthDate.slice(0, 2))
          const month = birthDate.slice(2, 4)
          const day = birthDate.slice(4, 6)
          const lastDigit = parseInt(birthDateLastDigit)
          
          // 뒷자리 1자리가 1,2면 1900년대, 3,4면 2000년대
          const fullYear = (lastDigit === 1 || lastDigit === 2) ? `19${year.toString().padStart(2, '0')}` : `20${year.toString().padStart(2, '0')}`
          fullBirthDate = `${fullYear}-${month}-${day}`
        } else {
          fullBirthDate = birthDate // date input에서 온 경우 그대로 사용
        }

        await signUpWithEmail(email, password, name, undefined, fullBirthDate)
        setSignUpStep('complete')
        // 회원가입 완료 후 홈으로 이동
        setTimeout(() => {
          const next = searchParams.get('next')
          const safeNext = next && next.startsWith('/') ? next : '/home'
          router.replace(safeNext)
        }, 1500)
      } else {
        await signInWithEmail(email, password)
        const next = searchParams.get('next')
        const safeNext = next && next.startsWith('/') ? next : '/home'
        router.replace(safeNext)
      }
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

  // 회원가입 초기화
  const resetSignUp = () => {
    setSignUpStep('email')
    setIsEmailVerified(false)
    setVerificationCode('')
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    setName('')
    setBirthDate('')
    setBirthDateLastDigit('')
    setError(null)
  }

  // 이메일 폼이 표시되지 않으면 로그인/회원가입 버튼만 표시
  if (!showEmailForm && !isSignUp) {
    return (
      <>
        <div className="w-full max-w-lg mx-auto px-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-body">
              {error}
            </div>
          )}

          {/* 이메일 로그인 | 회원가입 버튼 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsSignUp(false)
                setShowEmailForm(true)
              }}
              className="w-full py-4 px-4 rounded-lg bg-primary/90 text-white font-bold active:opacity-90 shadow-sm"
            >
              이메일 로그인
            </button>
            <div className="text-center text-body text-text-sub">
              아직 계정이 없나요?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true)
                  setShowEmailForm(true)
                  resetSignUp()
                }}
                className="text-primary font-semibold hover:underline active:opacity-80"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>

        {/* 하단 시트 모달 */}
        <BottomSheet
          isOpen={showEmailForm}
          onClose={() => {
            setShowEmailForm(false)
            if (isSignUp) {
              resetSignUp()
            }
          }}
          title={isSignUp ? '회원가입' : '이메일 로그인'}
          closeOnBackdropClick={false}
          showCloseButton={true}
        >
          <EmailAuthForm
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            passwordConfirm={passwordConfirm}
            setPasswordConfirm={setPasswordConfirm}
            name={name}
            setName={setName}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            birthDateLastDigit={birthDateLastDigit}
            setBirthDateLastDigit={setBirthDateLastDigit}
            signUpStep={signUpStep}
            setSignUpStep={setSignUpStep}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            isEmailVerified={isEmailVerified}
            setIsEmailVerified={setIsEmailVerified}
            sendingCode={sendingCode}
            verifyingCode={verifyingCode}
            onSendCode={handleSendVerificationCode}
            onVerifyCode={handleVerifyCode}
            onPasswordNext={handlePasswordNext}
            birthDateInputRef={birthDateInputRef}
            birthDateLastDigitInputRef={birthDateLastDigitInputRef}
            nameInputRef={nameInputRef}
            passwordInputRef={passwordInputRef}
            passwordConfirmInputRef={passwordConfirmInputRef}
            loading={loading}
            error={error}
            onSubmit={handleEmailAuth}
            onClose={() => {
              setShowEmailForm(false)
              if (isSignUp) {
                resetSignUp()
              }
            }}
          />
        </BottomSheet>
      </>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-body">
          {error}
        </div>
      )}

      {/* 이메일 로그인 | 회원가입 버튼 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            setIsSignUp(false)
            setShowEmailForm(true)
          }}
          className="w-full py-4 px-4 rounded-lg bg-primary text-white font-bold active:opacity-90 shadow-sm"
        >
          이메일 로그인
        </button>
        <div className="text-center text-body text-text-sub">
          아직 계정이 없나요?{' '}
          <button
            onClick={() => {
              setIsSignUp(true)
              setShowEmailForm(true)
              resetSignUp()
            }}
            className="text-primary font-semibold hover:underline active:opacity-80"
          >
            회원가입
          </button>
        </div>
      </div>

      {/* 하단 시트 모달 */}
      <BottomSheet
        isOpen={showEmailForm}
        onClose={() => {
          setShowEmailForm(false)
          if (isSignUp) {
            resetSignUp()
          }
        }}
        title={isSignUp ? '회원가입' : '이메일 로그인'}
        closeOnBackdropClick={false}
        showCloseButton={true}
      >
        <EmailAuthForm
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          passwordConfirm={passwordConfirm}
          setPasswordConfirm={setPasswordConfirm}
          name={name}
          setName={setName}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          birthDateLastDigit={birthDateLastDigit}
          setBirthDateLastDigit={setBirthDateLastDigit}
          signUpStep={signUpStep}
          setSignUpStep={setSignUpStep}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          isEmailVerified={isEmailVerified}
          setIsEmailVerified={setIsEmailVerified}
          sendingCode={sendingCode}
          verifyingCode={verifyingCode}
          onSendCode={handleSendVerificationCode}
          onVerifyCode={handleVerifyCode}
          onPasswordNext={handlePasswordNext}
          birthDateInputRef={birthDateInputRef}
          birthDateLastDigitInputRef={birthDateLastDigitInputRef}
          passwordConfirmInputRef={passwordConfirmInputRef}
          nameInputRef={nameInputRef}
          passwordInputRef={passwordInputRef}
          loading={loading}
          error={error}
          onSubmit={handleEmailAuth}
          onClose={() => {
            setShowEmailForm(false)
            if (isSignUp) {
              resetSignUp()
            }
          }}
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
  passwordConfirm: string
  setPasswordConfirm: (value: string) => void
  name: string
  setName: (value: string) => void
  birthDate: string
  setBirthDate: (value: string) => void
  birthDateLastDigit: string
  setBirthDateLastDigit: (value: string) => void
  signUpStep: SignUpStep
  setSignUpStep: (value: SignUpStep) => void
  verificationCode: string
  setVerificationCode: (value: string) => void
  isEmailVerified: boolean
  setIsEmailVerified: (value: boolean) => void
  sendingCode: boolean
  verifyingCode: boolean
  onSendCode: () => void
  onVerifyCode: () => void
  onPasswordNext: () => void
  birthDateInputRef: React.RefObject<HTMLInputElement>
  birthDateLastDigitInputRef: React.RefObject<HTMLInputElement>
  nameInputRef: React.RefObject<HTMLInputElement>
  passwordInputRef: React.RefObject<HTMLInputElement>
  passwordConfirmInputRef: React.RefObject<HTMLInputElement>
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
  passwordConfirm,
  setPasswordConfirm,
  name,
  setName,
  birthDate,
  setBirthDate,
  birthDateLastDigit,
  setBirthDateLastDigit,
  signUpStep,
  verificationCode,
  setVerificationCode,
  isEmailVerified,
  setIsEmailVerified,
  sendingCode,
  verifyingCode,
  onSendCode,
  onVerifyCode,
  onPasswordNext,
  birthDateInputRef,
  birthDateLastDigitInputRef,
  nameInputRef,
  passwordInputRef,
  passwordConfirmInputRef,
  loading,
  error,
  onSubmit,
  onClose,
}: EmailAuthFormProps) {
  // 회원가입 완료 화면
  if (signUpStep === 'complete') {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-text-main">회원가입이 완료되었습니다!</h3>
        <p className="text-body text-text-sub">잠시 후 홈으로 이동합니다...</p>
      </div>
    )
  }

  return (
    <>
      {/* 인증번호 발송 중 로딩 화면 */}
      {sendingCode && (
        <BrandLoader
          fullScreen={true}
          text="인증번호를 발송하고 있어요..."
        />
      )}
      
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-body">
            {error}
          </div>
        )}

      {isSignUp ? (
        // 회원가입 단계별 폼
        <>
          {signUpStep !== 'passwordConfirm' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-body text-text-main mb-2">이메일</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="email@example.com"
                      disabled={isEmailVerified}
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={onSendCode}
                      disabled={sendingCode || isEmailVerified || !email.trim()}
                      className="px-4 py-3 rounded-lg bg-primary text-white font-semibold active:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap"
                    >
                      {sendingCode ? '발송중...' : isEmailVerified ? '인증완료' : '인증번호 발송'}
                    </button>
                  </div>
                </div>

                {!isEmailVerified && (
                  <div>
                    <label className="block text-body text-text-main mb-2">인증번호</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setVerificationCode(value)
                          }}
                          placeholder="6자리 숫자"
                          maxLength={6}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={onVerifyCode}
                          disabled={verifyingCode || verificationCode.length !== 6}
                          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white font-semibold active:opacity-90 disabled:opacity-50 transition-all whitespace-nowrap"
                        >
                          {verifyingCode ? '확인중...' : '확인'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isEmailVerified && (
                  <div className="p-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-body">
                    ✓ 이메일 인증이 완료되었습니다.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-body text-text-main mb-2">생년월일</label>
                  <div className="relative grid grid-cols-2 gap-4 items-center">
                    <input
                      ref={birthDateInputRef}
                      type="text"
                      value={birthDate}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setBirthDate(value)
                      }}
                      placeholder="YYMMDD"
                      maxLength={6}
                      className="flex-1 px-4 py-3 rounded-lg border-2 text-center border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <span className="text-text-sub flex-shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">-</span>
                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        ref={birthDateLastDigitInputRef}
                        type="text"
                        value={birthDateLastDigit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 1)
                          setBirthDateLastDigit(value)
                        }}
                        placeholder="●"
                        maxLength={1}
                        className="w-full px-4 py-3 rounded-lg border-2 text-center border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <span className="flex-1 text-text-main text-text-sub whitespace-nowrap">●●●●●●</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-sub mt-1">생년월일 6자리와 뒷자리 1자리를 입력해주세요</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-body text-text-main mb-2">이름</label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="홍길동"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={onPasswordNext}
                  disabled={!name.trim()}
                  className="w-full py-3.5 px-4 rounded-lg bg-primary text-white text-body font-semibold shadow-lg active:opacity-90 disabled:opacity-50 transition-all"
                >
                  다음
                </button>
              </div>
            </>
          )}

          {signUpStep === 'passwordConfirm' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-body text-text-main mb-2">비밀번호</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-body text-text-main mb-2">비밀번호 확인</label>
                <input
                  ref={passwordConfirmInputRef}
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || password !== passwordConfirm || password.length < 6}
                className="w-full py-3.5 px-4 rounded-lg bg-primary text-white text-body font-semibold shadow-lg active:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? '처리 중...' : '회원가입하기'}
              </button>
            </form>
          )}
        </>
      ) : (
        // 로그인 폼
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-body text-text-main mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-lg bg-primary text-white text-body font-semibold shadow-lg active:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? '처리 중...' : '로그인하기'}
          </button>
        </form>
      )}

      {/* 로그인/회원가입 전환 */}
      {!isSignUp && <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setEmail('')
            setPassword('')
            setPasswordConfirm('')
            setName('')
            setBirthDate('')
            setBirthDateLastDigit('')
            setVerificationCode('')
            setIsEmailVerified(false)
          }}
          className="text-sm text-text-sub active:opacity-70 transition-colors"
        >
          계정이 없으신가요? 회원가입
        </button>
      </div>}
      </div>
    </>
  )
}
