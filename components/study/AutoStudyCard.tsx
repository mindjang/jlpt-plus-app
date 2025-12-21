'use client'

import { useRouter } from 'next/navigation'
import { SemicircleProgress } from '@/components/ui/SemicircleProgress'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'
import { hexToRgba } from '@/lib/utils/colorUtils'

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
  
  const getButtonLabel = () => {
    if (sessionTotal === 0) return '학습할 카드가 없습니다'
    if (sessionProgress === 0) return '학습하기'
    
    const current = Math.min(sessionProgress, sessionTotal || targetAmount)
    const total = sessionTotal || targetAmount
    
    if (sessionProgress >= total) {
      return `학습하기 (${current}/${total})`
    }
    return `이어서 학습하기 (${current}/${total})`
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl shadow-black/5 flex flex-col gap-5 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl" style={{ background: gradient.to }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5 blur-2xl" style={{ background: gradient.from }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-title font-bold text-text-main leading-tight">자동 학습</h2>
            <span 
              className="px-3 py-1 rounded-full text-label font-semibold shadow-sm border"
              style={{
                backgroundColor: hexToRgba(gradient.from, 0.15) || 'rgba(249, 250, 251, 0.5)',
                borderColor: hexToRgba(gradient.to, 0.3) || 'rgba(0, 0, 0, 0.1)',
                color: '#2A2A2A',
              }}
            >
              {studyRound}회차
            </span>
          </div>
          <button 
            onClick={() => router.push('/stats')}
            className="text-label text-text-main hover:opacity-70 transition-opacity duration-200 font-medium"
          >
            기록 →
          </button>
        </div>

        {/* 목표 학습량과 진행률 차트 */}
        <div className="grid grid-cols-2 gap-5 items-start mb-6">
          <div className="space-y-2">
            <span className="text-label text-text-sub block font-medium">목표 학습량</span>
            <select
              value={targetAmount}
              onChange={(e) => onTargetAmountChange(Number(e.target.value))}
              disabled={!canChangeTarget}
              className={`px-4 py-2.5 w-full rounded-xl border-2 bg-white text-body font-medium appearance-none transition-all duration-200 shadow-sm ${
                canChangeTarget
                  ? 'border-gray-200 text-text-main hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer'
                  : 'border-gray-200 text-text-sub opacity-60 cursor-not-allowed'
              }`}
              style={{
                backgroundImage: canChangeTarget
                  ? `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                  : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: canChangeTarget ? '2.75rem' : '1rem',
                '--tw-ring-color': gradient.to,
              } as React.CSSProperties & { '--tw-ring-color'?: string }}
            >
              {AUTO_STUDY_TARGET_OPTIONS.map((val) => (
                <option key={val} value={val}>{val}개</option>
              ))}
            </select>
          </div>

          {/* 진행률 반원형 차트 */}
          <div className="flex justify-end items-center h-full">
            <SemicircleProgress
              value={loading ? 0 : sessionTotal === 0 ? 0 : Math.min((sessionProgress / sessionTotal) * 100, 100)}
              progress={loading ? 0 : Math.min(sessionProgress, sessionTotal || targetAmount)}
              total={sessionTotal || targetAmount}
              color={gradient.to}
            />
          </div>
        </div>

        {/* 새 단어 / 복습 단어 */}
        <div className="flex flex-col gap-3 mb-5">
          <div 
            className="cursor-pointer flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: hexToRgba(gradient.from, 0.8) || 'rgba(249, 250, 251, 0.5)',
            }}
            onClick={() => router.push(`/acquire/auto-study/${level}/new-words?type=${activeTab}&limit=${targetAmount}`)}
          >
            <span className="text-label text-text-sub font-medium">
              새 {activeTab === 'word' ? '단어' : '한자'}
            </span>
            <button
              className="text-body text-text-main font-bold hover:opacity-70 transition-opacity duration-200 flex items-center gap-1"
            >
              {loading ? '...' : newWords} <span className="text-text-sub">→</span>
            </button>
          </div>
          <div 
            className="cursor-pointer flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: hexToRgba(gradient.from, 0.8) || 'rgba(249, 250, 251, 0.5)',
            }}
            onClick={() => {
              if (reviewWords > 0) {
                router.push(
                  `/practice/learn?level=${level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}&review=true`
                )
              }
            }}
          >
            <span className="text-label text-text-sub font-medium">
              복습 {activeTab === 'word' ? '단어' : '한자'}
            </span>
            <span className="text-body text-text-main font-bold flex items-center gap-1">
              {loading ? '...' : reviewWords} <span className="text-text-sub">→</span>
            </span>
          </div>
        </div>
        
        {/* 학습하기 버튼 */}
        <button
          onClick={() =>
            router.push(
              `/practice/learn?level=${level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}`
            )
          }
          className="w-full py-4 px-4 rounded-xl text-body font-bold text-text-main active:opacity-90 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, ${gradient.to}, ${gradient.from})`,
            boxShadow: `0 10px 25px ${hexToRgba(gradient.to, 0.3) || 'rgba(0, 0, 0, 0.1)'}`,
          }}
          disabled={sessionTotal === 0}
        >
          <span className="relative z-10">
            {getButtonLabel()}
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>

        {/* 미래 복습 안내 */}
        {sessionTotal === 0 && nextReviewDays !== null && (
          <div 
            className="text-label text-text-sub text-center mt-4 p-3 rounded-xl"
            style={{
              backgroundColor: hexToRgba(gradient.from, 0.1) || 'rgba(239, 246, 255, 0.5)',
            }}
          >
            다음 복습까지 약 <span className="font-semibold" style={{ color: gradient.to }}>{nextReviewDays}일</span> 남았습니다.
          </div>
        )}
      </div>
    </div>
  )
}
