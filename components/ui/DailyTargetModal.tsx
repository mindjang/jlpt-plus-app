'use client'

import React, { useState } from 'react'
import { AUTO_STUDY_TARGET_OPTIONS } from '@/lib/constants/ui'
import { hexToRgba } from '@/lib/utils/colorUtils'

interface DailyTargetModalProps {
  isOpen: boolean
  onClose: () => void
  initialValue: number
  onSave: (value: number) => Promise<void>
  color?: string
}

export function DailyTargetModal({
  isOpen,
  onClose,
  initialValue,
  onSave,
  color = '#000000', // Default to black if not provided
}: DailyTargetModalProps) {
  const [draft, setDraft] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  // 모달이 열릴 때마다 초기값 동기화
  React.useEffect(() => {
    if (isOpen) {
      setDraft(initialValue)
    }
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const clampTarget = (val: number) => {
    const min = AUTO_STUDY_TARGET_OPTIONS[0]
    const max = AUTO_STUDY_TARGET_OPTIONS[AUTO_STUDY_TARGET_OPTIONS.length - 1]
    return Math.min(max, Math.max(min, val))
  }

  const changeTarget = (delta: number) => {
    setDraft((prev) => clampTarget(prev + delta))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(draft)
      onClose()
    } catch (error) {
      console.error('Failed to save daily target:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-text-main transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-subtitle font-black text-text-main">데일리 목표 설정</h2>
          <p className="text-label text-text-sub mt-2">하루에 새로 학습할 단어 수를 조절하세요.<br />(5~40개, 5개 단위)</p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => changeTarget(-5)}
            className="w-14 h-14 rounded-2xl border-2 border-gray-100 text-display-s font-bold text-text-main flex items-center justify-center active:bg-gray-50 transition-colors hover:border-gray-200"
          >
            -
          </button>
          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-display-m font-black text-text-main">{draft}</span>
            <span className="text-label font-bold text-text-hint mt-1">개 / 일</span>
          </div>
          <button
            onClick={() => changeTarget(5)}
            className="w-14 h-14 rounded-2xl border-2 border-gray-100 text-display-s font-bold text-text-main flex items-center justify-center active:bg-gray-50 transition-colors hover:border-gray-200"
          >
            +
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 px-6 rounded-2xl text-white text-body font-black disabled:opacity-50 transition-all active:scale-[0.98] relative overflow-hidden group shadow-xl"
            style={{
              backgroundColor: color,
              boxShadow: `0 8px 20px ${hexToRgba(color, 0.25)}`
            }}
          >
            <span className="relative z-10">{saving ? '저장 중...' : '확인'}</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-gray-50 text-text-sub text-body font-bold hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
