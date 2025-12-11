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
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-subtitle font-semibold text-text-main pl-2 pt-4">
          {level} 학습 정보
        </h2>
        <button 
          onClick={onAllWordsClick}
          className="text-label text-text-sub"
        >
          모든 {activeTab === 'word' ? '단어' : '한자'} &gt;
        </button>
      </div>

      <div className="bg-surface rounded-card p-4 shadow-soft">
        {/* 장기 기억 단어/한자 */}
        <div className="mb-3">
          <ProgressDisplay
            current={loading ? 0 : longTermMemory}
            total={totalWords}
            color={gradient.to}
            label={`장기 기억 ${activeTab === 'word' ? '단어' : '한자'}`}
            labelPosition="left"
            numberPosition="right"
            showZeroIndicator
            className="grid grid-cols-2 gap-2 items-center"
          />
        </div>

        {/* 학습한 단어/한자 */}
        <div>
          <ProgressDisplay
            current={loading ? 0 : currentProgress}
            total={totalWords}
            color={gradient.to}
            label={`학습한 ${activeTab === 'word' ? '단어' : '한자'}`}
            labelPosition="left"
            numberPosition="right"
            showZeroIndicator
            className="grid grid-cols-2 gap-2 items-center"
          />
        </div>
      </div>
    </>
  )
}
