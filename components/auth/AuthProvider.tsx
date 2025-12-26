'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange, getCurrentUser, handleRedirectResult } from '@/lib/firebase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 유저 상태 확인
    setLoading(true)
    
    // 리디렉트 결과 처리 (WebView에서 Google 로그인 후)
    handleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          setUser(redirectUser)
          setLoading(false)
        } else {
          // 리디렉트 결과가 없으면 일반 초기화 진행
          const currentUser = getCurrentUser()
          
          // 초기 사용자가 있으면 즉시 설정 (로딩 시간 단축)
          if (currentUser) {
            setUser(currentUser)
            // onAuthChange가 호출될 때까지 잠시 대기 후 로딩 완료
            // Firebase Auth가 초기화되는 동안 짧은 딜레이
            const timeout = setTimeout(() => {
              setLoading(false)
            }, 100)
            
            // Auth 상태 변경 감지
            const unsubscribe = onAuthChange((user) => {
              setUser(user)
              clearTimeout(timeout)
              setLoading(false)
            })

            return () => {
              clearTimeout(timeout)
              unsubscribe()
            }
          } else {
            // 초기 사용자가 없으면 onAuthChange만 대기
            const unsubscribe = onAuthChange((user) => {
              setUser(user)
              setLoading(false)
            })

            return () => unsubscribe()
          }
        }
      })
      .catch((error) => {
        console.error('[AuthProvider] Redirect result error:', error)
        // 에러가 발생해도 일반 초기화 진행
        const currentUser = getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
        setLoading(false)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

