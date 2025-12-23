'use client'

import React from 'react'
import { MOGU_BRAND_COLORS } from '@/lib/constants/colors'
import { motion } from 'framer-motion'

interface BrandLoaderProps {
  /** 로더 크기 (기본: 64px) */
  size?: number
  /** 전체 화면 로더 여부 (기본: false) */
  fullScreen?: boolean
  /** 로더 텍스트 (기본: 없음) */
  text?: string
}

/**
 * Mogu 브랜드 컬러를 사용한 로더 컴포넌트
 */
export function BrandLoader({ size = 64, fullScreen = false, text }: BrandLoaderProps) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* 스피너 */}
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-0 rounded-full border-4"
          style={{
            borderColor: `${MOGU_BRAND_COLORS.primary}20`,
            borderTopColor: MOGU_BRAND_COLORS.primary,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* 내부 점 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: size * 0.3,
              height: size * 0.3,
              backgroundColor: MOGU_BRAND_COLORS.primary,
            }}
          />
        </motion.div>
      </div>

      {/* 텍스트 */}
      {text && (
        <motion.p
          className="text-body font-medium"
          style={{ color: MOGU_BRAND_COLORS.primary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-page">
        {loaderContent}
      </div>
    )
  }

  return loaderContent
}

