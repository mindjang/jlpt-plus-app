'use client'

import { ProgressDisplay } from '@/components/ui/ProgressDisplay'

interface StudyInfoCardProps {
  level: string
  activeTab: 'word' | 'kanji'
  longTermMemory: number
  currentProgress: number
  totalWords: number
  gradient: { to: string; from: string }
  loading: boolean
  onAllWordsClick: () => void
}

export function StudyInfoCard({
  level,
  activeTab,
  longTermMemory,
  currentProgress,
  totalWords,
  gradient,
  loading,
  onAllWordsClick,
}: StudyInfoCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title font-bold text-text-main leading-tight">
          {level} 학습 정보
        </h2>
        <button 
          onClick={onAllWordsClick}
          className="text-label text-text-sub hover:text-text-main transition-colors duration-200 font-medium"
        >
          모든 {activeTab === 'word' ? '단어' : '한자'} →
        </button>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl shadow-black/5 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 blur-2xl" style={{ background: gradient.to }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-5 blur-2xl" style={{ background: gradient.from }} />
        
        <div className="relative z-10 space-y-5">
          {/* 장기 기억 단어/한자 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label text-text-sub font-medium">장기 기억 {activeTab === 'word' ? '단어' : '한자'}</span>
              <span className="text-body text-text-main font-bold">
                {loading ? '...' : longTermMemory} / {totalWords}
              </span>
            </div>
            <div className="relative">
              <ProgressDisplay
                current={loading ? 0 : longTermMemory}
                total={totalWords}
                color={gradient.to}
                label={undefined}
                labelPosition="left"
                numberPosition="none"
                showZeroIndicator
                className=""
              />
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* 학습한 단어/한자 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label text-text-sub font-medium">학습한 {activeTab === 'word' ? '단어' : '한자'}</span>
              <span className="text-body text-text-main font-bold">
                {loading ? '...' : currentProgress} / {totalWords}
              </span>
            </div>
            <div className="relative">
              <ProgressDisplay
                current={loading ? 0 : currentProgress}
                total={totalWords}
                color={gradient.to}
                label={undefined}
                labelPosition="left"
                numberPosition="none"
                showZeroIndicator
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
