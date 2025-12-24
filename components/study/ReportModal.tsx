'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: 'word' | 'kanji'
  contentText: string
  level: string
  onSubmit: (report: { content: string; reason: string }) => Promise<void>
}

/**
 * 학습 콘텐츠 신고 모달
 */
export function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentText,
  level,
  onSubmit,
}: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('신고 사유를 입력해주세요.')
      return
    }

    if (reason.trim().length < 10) {
      setError('신고 사유를 10자 이상 입력해주세요.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        content: contentText,
        reason: reason.trim(),
      })
      // 성공 시 모달 닫기
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '신고 제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setReason('')
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="콘텐츠 신고"
    >
      <div className="space-y-4">
        {/* 현재 학습 중인 콘텐츠 (readonly) */}
        <div>
          <label className="block text-label font-medium text-text-main mb-2">
            {contentType === 'word' ? '단어' : '한자'}
          </label>
          <div
            className="w-full px-3 py-2 rounded-md shadow-soft bg-gray-50 text-body text-text-main cursor-not-allowed"
            dangerouslySetInnerHTML={{ __html: contentText }}
          >
          </div>
        </div>

        {/* 레벨 표시 */}
        <div>
          <label className="block text-label font-medium text-text-main mb-2">
            레벨
          </label>
          <input
            type="text"
            value={level}
            readOnly
            className="w-full px-3 py-2 rounded-md shadow-soft bg-gray-50 text-body text-text-main cursor-not-allowed"
          />
        </div>

        {/* 신고 사유 입력 */}
        <div>
          <label className="block text-label font-medium text-text-main mb-2">
            어떤 것이 어떻게 잘못되었는지 알려주세요
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 뜻이 잘못되었습니다. '사과'가 아니라 '감사'가 맞습니다."
            rows={5}
            className="w-full px-3 py-2 rounded-md shadow-soft bg-surface text-body text-text-main placeholder:text-text-sub focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            disabled={submitting}
          />
          <p className="text-xs text-text-sub mt-1">
            최소 10자 이상 입력해주세요. ({reason.length}/10)
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-body text-red-500 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-lg bg-surface shadow-soft text-body font-medium text-text-main active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim() || reason.trim().length < 10}
            className="flex-1 py-3 px-4 rounded-lg bg-primary text-surface text-body font-medium active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '제출 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
