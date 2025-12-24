'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SemicircleProgress } from '@/components/ui/SemicircleProgress'
import { DailyTargetModal } from '@/components/ui/DailyTargetModal'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'
import { hexToRgba } from '@/lib/utils/colorUtils'
import { LEVEL_COLORS, normalizeLevel } from '@/lib/constants/colors'

interface AutoStudyCardProps {
  level: string
  activeTab: 'word' | 'kanji'
  studyRound: number
  targetAmount: number
  sessionProgress: number
  sessionTotal: number
  newWords: number
  reviewWords: number
  nextReviewDays: number | null
  gradient: { to: string; from: string }
  loading: boolean
  onTargetAmountChange: (amount: number) => void
  canChangeTarget?: boolean
}

export function AutoStudyCard({
  level,
  activeTab,
  studyRound,
  targetAmount,
  sessionProgress,
  sessionTotal,
  newWords,
  reviewWords,
  nextReviewDays,
  gradient,
  loading,
  onTargetAmountChange,
  canChangeTarget = true,
}: AutoStudyCardProps) {
  const router = useRouter()
  const [showTargetModal, setShowTargetModal] = useState(false)
  const levelPrimary = LEVEL_COLORS[normalizeLevel(level)]

  const getButtonLabel = () => {
    if (sessionTotal === 0) return '모든 학습 완료'
    if (sessionProgress === 0) return '학습 시작하기'

    const current = Math.min(sessionProgress, sessionTotal || targetAmount)
    const total = sessionTotal || targetAmount

    return `이어서 학습 (${current}/${total})`
  }

  return (
    <div
      className="bg-white/95 backdrop-blur-xl rounded-[24px] p-5 border shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: hexToRgba(levelPrimary, 0.15),
        boxShadow: `0 20px 40px ${hexToRgba(levelPrimary, 0.08)}`
      }}
    >
      {/* 장식용 배경 요소 (이건 부드러운 깊이감을 위해 그라데이션 컬러 유지) */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: gradient.to }} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ background: gradient.from }} />

      <div className="relative z-10">
        {/* 헤더 섹션: 회차 및 기록 버튼 */}
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 bg-page/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/40 shadow-sm">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: levelPrimary }} />
            <span className="text-[13px] font-black text-text-main">{studyRound}회차</span>
          </div>
          <button
            onClick={() => router.push('/history')}
            className="text-[13px] font-bold text-text-sub hover:text-text-main transition-colors duration-200 flex items-center gap-1 group"
          >
            학습 기록 <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </button>
        </div>

        {/* 중앙 집중형 진행률 섹션 */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-full max-w-[240px] aspect-[16/10]">
            <SemicircleProgress
              value={loading ? 0 : sessionTotal === 0 ? 100 : Math.min((sessionProgress / sessionTotal) * 100, 100)}
              progress={loading ? 0 : Math.min(sessionProgress, sessionTotal || targetAmount)}
              total={sessionTotal || targetAmount}
              color={levelPrimary}
            />
          </div>
          <div className="text-center -mt-2">
            <h2 className="text-display-s font-black text-text-main leading-tight tracking-tight">
              오늘의 학습 진행
            </h2>
            <p className="text-label text-text-sub mt-1">
              현재 {level} {activeTab === 'word' ? '단어' : '한자'} 학습 중
            </p>
          </div>
        </div>

        {/* 상세 통계 및 설정 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* 목표 설정 박스 (이제 모달을 띄웁니다) */}
          <div
            onClick={() => {
              if (canChangeTarget) setShowTargetModal(true)
              else router.push('/my?tab=membership')
            }}
            className="p-4 rounded-lg border bg-white/40 backdrop-blur-sm space-y-2 transition-all duration-200 cursor-pointer hover:brightness-95 active:scale-[0.98]"
            style={{
              borderColor: hexToRgba(levelPrimary, 0.3),
              backgroundColor: hexToRgba(levelPrimary, 0.03)
            }}
          >
            <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider block">데일리 목표</span>
            <div className="flex items-center justify-between">
              <span className="text-body font-black text-text-main">{targetAmount}개</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-text-sub">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <button
            onClick={() => router.push(`/acquire/auto-study/${level}/${activeTab}/new-words?limit=${targetAmount}`)}
            className="p-4 rounded-lg border bg-white/40 backdrop-blur-sm text-left hover:brightness-95 active:scale-[0.98] transition-all duration-200"
            style={{
              borderColor: hexToRgba(levelPrimary, 0.3),
              backgroundColor: hexToRgba(levelPrimary, 0.03)
            }}
          >
            <span className="text-[11px] font-bold text-text-sub uppercase tracking-wider block">새 {activeTab === 'word' ? '단어' : '한자'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-body font-black text-text-main">{loading ? '...' : newWords}</span>
              <span className="text-[10px] font-bold text-text-sub">개 보관중</span>
            </div>
          </button>
        </div>

        {/* 복습 섹션 (Full Width) */}
        <button
          onClick={() => {
            if (reviewWords > 0) {
              router.push(`/practice/learn?level=${level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}&review=true`)
            }
          }}
          disabled={reviewWords === 0}
          className={`mb-2 flex items-center justify-between w-full p-4 rounded-lg border transition-all duration-200 ${reviewWords > 0
            ? 'hover:brightness-95 active:scale-[0.99] cursor-pointer'
            : 'opacity-50 cursor-default'
            }`}
          style={{
            borderColor: hexToRgba(levelPrimary, 0.3),
            backgroundColor: hexToRgba(levelPrimary, 0.03)
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={levelPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" />
              </svg>
            </div>
            <div>
              <span className="text-[13px] font-black text-text-main block">스마트 복습</span>
            </div>
          </div>
          <div className="text-body font-black" style={{ color: levelPrimary }}>
            {loading ? '...' : reviewWords}
          </div>
        </button>

        {/* 학습 시작 버튼 (The Major CTA) */}
        <button
          onClick={() => router.push(`/practice/learn?level=${level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}`)}
          className="w-full py-4 px-4 rounded-lg bg-primary text-white text-body font-bold active:opacity-90 shadow-card flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${levelPrimary} 0%, ${hexToRgba(levelPrimary, 1)} 100%)`,
            boxShadow: `0 15px 35px ${hexToRgba(levelPrimary, 0.35)}`,
          }}
          disabled={sessionTotal === 0}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {getButtonLabel()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
          {/* 빛 효과 모션 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </button>

        {/* 상태 안내 */}
        {sessionTotal === 0 && nextReviewDays !== null && (
          <p className="text-[11px] text-text-sub text-center mt-6 font-bold flex items-center justify-center gap-1.5 grayscale opacity-80">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            다음 학습까지 약 <span className="text-text-main font-black underline decoration-2" style={{ textDecorationColor: hexToRgba(levelPrimary, 0.4) }}>{nextReviewDays}일</span> 남았습니다
          </p>
        )}
      </div>

      <DailyTargetModal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        initialValue={targetAmount}
        color={levelPrimary}
        onSave={async (val) => {
          onTargetAmountChange(val)
        }}
      />
    </div>
  )
}
