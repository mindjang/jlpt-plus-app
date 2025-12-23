'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

/**
 * 하단에서 올라오는 모달 컴포넌트
 */
export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dim 배경 */}
          <motion.div
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 하단 시트 */}
          <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none">
            <motion.div
              className="bg-surface rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 헤더 */}
              {title && (
                <div className="px-6 pb-4 border-b border-divider">
                  <h2 className="text-title font-semibold text-text-main">
                    {title}
                  </h2>
                </div>
              )}

              {/* 내용 */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

