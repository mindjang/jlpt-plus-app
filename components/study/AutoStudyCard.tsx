'use client'

import { useRouter } from 'next/navigation'
import { SemicircleProgress } from '@/components/ui/SemicircleProgress'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'

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
    <div className="bg-surface rounded-lg p-4 border border-divider flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-subtitle font-semibold text-text-main">자동 학습</h2>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
            {studyRound}회차
          </span>
        </div>
        <button 
          onClick={() => router.push('/stats')}
          className="text-body text-text-sub active:text-text-main"
        >
          기록 &gt;
        </button>
      </div>

      {/* 목표 학습량과 진행률 차트 */}
      <div className="grid grid-cols-2 gap-4 items-center justify-between">
        <div>
          <span className="text-body text-text-sub block mb-2">목표 학습량</span>
          <select
            value={targetAmount}
            onChange={(e) => onTargetAmountChange(Number(e.target.value))}
            className="px-3 py-1.5 w-full rounded-md border border-divider bg-surface text-body text-text-main appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2.5rem',
            }}
          >
            {AUTO_STUDY_TARGET_OPTIONS.map((val) => (
              <option key={val} value={val}>{val}개</option>
            ))}
          </select>
        </div>

        {/* 진행률 반원형 차트 */}
        <SemicircleProgress
          value={loading ? 0 : sessionTotal === 0 ? 0 : Math.min((sessionProgress / sessionTotal) * 100, 100)}
          progress={loading ? 0 : Math.min(sessionProgress, sessionTotal || targetAmount)}
          total={sessionTotal || targetAmount}
          color={gradient.to}
        />
      </div>

      {/* 새 단어 / 복습 단어 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-body text-text-sub">
            새 {activeTab === 'word' ? '단어' : '한자'}
          </span>
          <button 
            onClick={() => router.push(`/acquire/auto-study/${level}/new-words?type=${activeTab}&limit=${targetAmount}`)}
            className="text-body text-text-main font-medium"
          >
            {loading ? '...' : newWords} &gt;
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body text-text-sub">
            복습 {activeTab === 'word' ? '단어' : '한자'}
          </span>
          <button className="text-body text-text-main font-medium">
            {loading ? '...' : reviewWords} &gt;
          </button>
        </div>
        
        {/* 학습하기 버튼 */}
        <button
          onClick={() =>
            router.push(
              `/practice/learn?level=${level}&type=${activeTab}&limit=${targetAmount}&done=${sessionProgress}`
            )
          }
          className="w-full py-4 px-6 rounded-lg bg-primary text-surface text-body font-semibold active:opacity-80"
          disabled={sessionTotal === 0}
        >
          {getButtonLabel()}
        </button>
      </div>

      {/* 미래 복습 안내 */}
      {sessionTotal === 0 && nextReviewDays !== null && (
        <div className="text-body text-text-sub text-center mt-2">
          다음 복습까지 약 {nextReviewDays}일 남았습니다.
        </div>
      )}
    </div>
  )
}
