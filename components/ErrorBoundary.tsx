'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary
 * 자식 컴포넌트에서 발생한 에러를 포착하여 앱 크래시 방지
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 커스텀 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-page p-4">
          <div className="max-w-md w-full bg-surface rounded-lg border border-divider p-6 text-center">
            <div className="mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-title font-bold text-text-main mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-body text-text-sub">
                일시적인 문제가 발생했습니다.
                <br />
                다시 시도해주세요.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-label font-semibold text-red-800 mb-1">
                  개발 모드 에러 정보:
                </p>
                <p className="text-label text-red-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-primary text-surface rounded-md text-body font-semibold active:opacity-80"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-2 px-4 bg-gray-200 text-text-main rounded-md text-body font-semibold active:bg-gray-300"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 페이지별 에러 경계 (작은 섹션용)
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName 
}: { 
  children: ReactNode
  sectionName?: string 
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
          <p className="text-body text-red-800">
            {sectionName ? `${sectionName} 영역` : '이 섹션'}에서 오류가 발생했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1 bg-red-600 text-white rounded text-label active:bg-red-700"
          >
            새로고침
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
