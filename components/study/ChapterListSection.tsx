'use client'

import { ProgressDisplay } from '@/components/ui/ProgressDisplay'
import { CHAPTER_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'

interface ChapterData {
  number: number
  totalWords: number
  longTermMemory: number
  learned: number
}

interface ChapterListSectionProps {
  activeTab: 'word' | 'kanji'
  targetAmount: number
  chapters: ChapterData[]
  gradient: { to: string; from: string }
  onTargetAmountChange: (amount: number) => void
}

export function ChapterListSection({
  activeTab,
  targetAmount,
  chapters,
  gradient,
  onTargetAmountChange,
}: ChapterListSectionProps) {
  return (
    <div className="px-4 pt-4 space-y-3">
      {/* 목표 학습량 */}
      <div className="flex items-center justify-between">
        <span className="text-label text-text-sub">목표 학습량</span>
        <select
          value={targetAmount}
          onChange={(e) => onTargetAmountChange(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-divider bg-surface text-body text-text-main"
        >
          {CHAPTER_STUDY_TARGET_OPTIONS.map((val) => (
            <option key={val} value={val}>{val}개</option>
          ))}
        </select>
      </div>

      {/* 챕터 리스트 */}
      <div className="space-y-2.5">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.number}
            className="bg-surface rounded-lg p-4 border border-divider"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-label font-medium">
                    학습 대기 중
                  </span>
                )}
                <span className="text-body font-semibold text-text-main">
                  챕터 {chapter.number}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-label">
                  1회차
                </span>
              </div>
              <span className="text-body text-text-sub">{chapter.totalWords}개</span>
            </div>

            {/* 장기 기억 단어 */}
            <div className="mb-2">
              <ProgressDisplay
                current={chapter.longTermMemory}
                total={chapter.totalWords}
                color={gradient.to}
                label={`장기 기억 ${activeTab === 'word' ? '단어' : '한자'}`}
                labelPosition="left"
                numberPosition="right"
              />
            </div>

            {/* 학습한 단어 */}
            <div>
              <ProgressDisplay
                current={chapter.learned}
                total={chapter.totalWords}
                color={gradient.to}
                label={`학습한 ${activeTab === 'word' ? '단어' : '한자'}`}
                labelPosition="left"
                numberPosition="right"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
