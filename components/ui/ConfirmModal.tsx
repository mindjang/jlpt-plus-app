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
            className="flex-1 py-3 px-4 bg-page border border-divider rounded-lg text-body font-medium active:bg-gray-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-lg text-body font-medium active:opacity-80 disabled:opacity-50 ${
              confirmButtonColor === 'danger'
                ? 'bg-red-500 text-surface'
                : 'bg-primary text-surface'
            }`}
          >
            {loading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
