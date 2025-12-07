'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter()

  const handleNavigate = (path: string) => {
    router.push(path)
    onClose()
  }

  return (
    <>
      {/* Dim 배경 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* 사이드 메뉴 */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 w-80 bg-surface z-50 shadow-soft"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                {/* 헤더 */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-divider">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-green-500 via-orange-500 to-blue-500 flex items-center justify-center">
                    <span className="text-label font-bold text-surface">JLPT</span>
                  </div>
                  <h2 className="text-title font-semibold text-text-main">JLPT Plus</h2>
                </div>

                {/* 메뉴 내용 */}
                <div className="flex-1 overflow-y-auto py-4">
                  {/* 학습 섹션 */}
                  <div className="mb-6">
                    <h3 className="px-6 mb-3 text-label font-medium text-text-sub uppercase">
                      학습
                    </h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleNavigate('/kana')}
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-page transition-colors"
                      >
                        <span className="text-subtitle text-jp">あ</span>
                        <span className="text-body text-text-main">카나</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('/search')}
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-page transition-colors"
                      >
                        <span className="text-body">🔍</span>
                        <span className="text-body text-text-main">검색</span>
                      </button>
                    </div>
                  </div>

                  {/* 관리 섹션 */}
                  <div className="mb-6">
                    <h3 className="px-6 mb-3 text-label font-medium text-text-sub uppercase">
                      관리
                    </h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          // 통계 페이지로 이동
                          onClose()
                        }}
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-page transition-colors"
                      >
                        <span className="text-body">📊</span>
                        <span className="text-body text-text-main">통계</span>
                      </button>
                      <button
                        onClick={() => {
                          // 설정 페이지로 이동
                          onClose()
                        }}
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-page transition-colors"
                      >
                        <span className="text-body">⚙️</span>
                        <span className="text-body text-text-main">설정</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 하단 업그레이드 버튼 */}
                <div className="p-6 border-t border-divider">
                  <button
                    onClick={() => {
                      // 업그레이드 페이지로 이동
                      onClose()
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-card bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 transition-colors"
                  >
                    <span className="text-body">🔒</span>
                    <span className="text-body font-medium">유료 버전으로 업그레이드</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

