'use client'

import { ProgressDisplay } from '@/components/ui/ProgressDisplay'
import { hexToRgba } from '@/lib/utils/colorUtils'
import { LEVEL_COLORS, normalizeLevel } from '@/lib/constants/colors'

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
  const levelPrimary = LEVEL_COLORS[normalizeLevel(level)]
  return (
    <div className="flex flex-col gap-4">
      {/* 섹션 헤더 */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-text-main leading-none">
            {level} 마스터리
          </h2>
          <p className="text-label text-text-sub mt-2 font-medium">
            전체 학습 현황 및 정복률
          </p>
        </div>
        <button
          onClick={onAllWordsClick}
          className="text-label font-bold text-text-sub hover:text-text-main transition-colors duration-200 flex items-center gap-1.5 pb-1"
        >
          목록 보기 <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className="bg-white/95 backdrop-blur-xl rounded-[24px] p-7 border shadow-xl relative overflow-hidden transition-all duration-300"
        style={{
          borderColor: hexToRgba(levelPrimary, 0.15),
          boxShadow: `0 15px 35px ${hexToRgba(levelPrimary, 0.05)}`
        }}
      >
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{ background: gradient.to }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{ background: gradient.from }} />

        <div className="relative z-10 space-y-4">
          {/* 장기 기억 (마스터) 현황 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="text-[13px] font-black text-text-main">완벽히 외운 {activeTab === 'word' ? '단어' : '한자'}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-title font-black text-text-main">{loading ? '...' : longTermMemory}</span>
                <span className="text-label font-bold text-text-sub">/ {totalWords}</span>
              </div>
            </div>

            <div className="relative px-0.5">
              <ProgressDisplay
                current={loading ? 0 : longTermMemory}
                total={totalWords}
                color={levelPrimary}
                numberPosition="none"
                showNumbers={false}
                className="scale-y-[1.2]"
              />
            </div>
            <p className="text-[11px] font-bold text-text-sub leading-relaxed opacity-70">
              반복 학습을 통해 장기 기억에 도달한 데이터입니다.
            </p>
          </div>

          {/* 중앙 구분선 */}
          <div className="relative py-0.5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100/80" />
            </div>
          </div>

          {/* 단순 학습 진행도 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-[13px] font-black text-text-main">한 번이라도 학습한 {activeTab === 'word' ? '단어' : '한자'}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-title font-black text-text-main">{loading ? '...' : currentProgress}</span>
                <span className="text-label font-bold text-text-sub">/ {totalWords}</span>
              </div>
            </div>

            <div className="relative px-0.5">
              <ProgressDisplay
                current={loading ? 0 : currentProgress}
                total={totalWords}
                color={hexToRgba(levelPrimary, 0.6)}
                numberPosition="none"
                showNumbers={false}
                className="scale-y-[1.2]"
              />
            </div>
            <p className="text-[11px] font-bold text-text-sub leading-relaxed opacity-70">
              전체 {totalWords}개 중 {currentProgress}개를 훑어보았습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
