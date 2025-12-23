'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { FeatureGuard } from '@/components/permissions/FeatureGuard'
import { SessionCompleteModal } from '@/components/study/SessionCompleteModal'
import type { StudySessionStats } from '@/lib/types/study'
import { BrandLoader } from '@/components/ui/BrandLoader'

function StudyResultContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [studyResult, setStudyResult] = useState<StudySessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [returnInfo, setReturnInfo] = useState<{ level: string; type: string } | null>(null)

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        router.push('/acquire')
      }
      return
    }

    // sessionStorage에서 결과 데이터 가져오기
    const storedResult = sessionStorage.getItem('studyResult')
    const storedReturnInfo = sessionStorage.getItem('studyReturnInfo')
    
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult)
        setStudyResult(result)
        
        // 복귀 정보도 함께 로드
        if (storedReturnInfo) {
          try {
            const returnData = JSON.parse(storedReturnInfo)
            setReturnInfo(returnData)
          } catch (error) {
            console.error('[StudyResultPage] Error parsing return info:', error)
          }
        }
        
        setLoading(false)
        
        // 로딩 완료 플래그 제거 (결과 페이지가 완전히 로드됨)
        sessionStorage.removeItem('studyResultLoading')
      } catch (error) {
        console.error('[StudyResultPage] Error parsing result:', error)
        router.push('/acquire')
      }
    } else {
      // 결과 데이터가 없으면 메뉴로 리다이렉트
      router.push('/acquire')
    }
  }, [user, authLoading, router])

  const handleClose = () => {
    // sessionStorage 정리
    sessionStorage.removeItem('studyResult')
    sessionStorage.removeItem('studyReturnInfo')
    
    // 자동 학습 시작 화면으로 이동
    if (returnInfo) {
      location.href = `/acquire/auto-study/${returnInfo.level}/${returnInfo.type}`
    } else {
      // 복귀 정보가 없으면 기본 경로로 이동
      location.href = '/acquire'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BrandLoader fullScreen={false} text="로딩 중..." />
      </div>
    )
  }

  if (!user) {
    return null // FeatureGuard가 처리
  }

  if (!studyResult) {
    return null
  }

  return (
    <FeatureGuard
      feature="study_session"
      customMessage={{
        title: '학습 결과',
        description: '학습 결과를 보려면 로그인이 필요합니다.',
      }}
    >
      <SessionCompleteModal stats={studyResult} onClose={handleClose} />
    </FeatureGuard>
  )
}

export default function StudyResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <BrandLoader fullScreen={false} text="로딩 중..." />
        </div>
      }
    >
      <StudyResultContent />
    </Suspense>
  )
}

