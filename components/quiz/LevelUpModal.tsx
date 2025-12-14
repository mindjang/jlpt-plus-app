'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLevelTitle } from '@/lib/quiz/expSystem'

interface LevelUpModalProps {
  isOpen: boolean
  newLevel: number
  onClose: () => void
}

export function LevelUpModal({ isOpen, newLevel, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-surface rounded-lg border border-divider p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 애니메이션 아이콘 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-center mb-6"
            >
              <div className="text-8xl">🎉</div>
            </motion.div>

            {/* 레벨업 메시지 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h2 className="text-display-m font-bold text-primary mb-2">
                레벨 업!
              </h2>
              <div className="text-title text-text-main mb-4">
                레벨 {newLevel}
              </div>
              <div className="text-body text-text-sub">
                {getLevelTitle(newLevel)}
              </div>
            </motion.div>

            {/* 축하 메시지 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-8 p-4 bg-primary bg-opacity-10 rounded-lg"
            >
              <p className="text-body text-text-main">
                축하합니다! 꾸준한 학습으로 한 단계 성장했어요! 🚀
              </p>
            </motion.div>

            {/* 계속하기 버튼 */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="w-full py-4 bg-primary text-white rounded-lg text-body font-semibold active:opacity-80"
            >
              계속하기
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

