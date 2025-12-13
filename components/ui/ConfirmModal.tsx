'use client'

import React from 'react'
import { Modal } from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonColor?: 'primary' | 'danger'
  loading?: boolean
}

/**
 * 확인 모달 컴포넌트
 * 사용자에게 중요한 액션을 확인받을 때 사용
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmButtonColor = 'primary',
  loading = false,
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Confirm action failed:', error)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-body text-text-main" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-page border border-divider rounded-card text-body font-medium button-press disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-card text-body font-medium button-press disabled:opacity-50 ${
              confirmButtonColor === 'danger'
                ? 'bg-red-500 text-surface hover:bg-red-600'
                : 'bg-primary text-surface hover:bg-primary/90'
            }`}
          >
            {loading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
