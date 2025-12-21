'use client'

import React from 'react'
import { hexToRgba } from '@/lib/utils/colorUtils'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface ProgressDisplayProps {
  /** 현재 진행된 항목 수 */
  current: number
  /** 전체 항목 수 */
  total: number
  /** 진행률 색상 (그라데이션 끝 색상, level에 맞는 컬러) */
  color?: string
  /** 추가 클래스명 */
  className?: string
  /** 숫자 표시 여부 */
  showNumbers?: boolean
  /** 숫자 표시 위치 ('left' | 'right' | 'none') */
  numberPosition?: 'left' | 'right' | 'none'
  /** 레이블 텍스트 (숫자 대신 표시할 텍스트) */
  label?: string
  /** 레이블 위치 ('left' | 'right') */
  labelPosition?: 'left' | 'right'
  /** 0일 때 작은 인디케이터 표시 여부 */
  showZeroIndicator?: boolean
}

/**
 * 재사용 가능한 진행률 표시 컴포넌트
 * level에 맞는 컬러와 주황색 보더를 사용하는 프로그레스바
 */
export function ProgressDisplay({
  current,
  total,
  color = LEVEL_COLORS.N5,
  className = '',
  showNumbers = true,
  numberPosition = 'right',
  label,
  labelPosition = 'left',
  showZeroIndicator = false,
}: ProgressDisplayProps) {
  const progress = total === 0 ? 0 : Math.max(Math.min((current / total) * 100, 100), 0)
  const backgroundColor = hexToRgba(color, 0.3)
  const borderColor = color

  // 레이블이나 숫자가 없으면 mb-1 제거
  const hasLabelOrNumber = (label && labelPosition === 'left') || 
                          (!label && showNumbers && numberPosition === 'left') ||
                          (showNumbers && numberPosition === 'right') ||
                          (label && labelPosition === 'right')

  return (
    <div className={className}>
      {/* 레이블 또는 숫자 */}
      {hasLabelOrNumber && (
        <div className="flex items-center justify-between mb-1">
          {label && labelPosition === 'left' && (
            <span className="text-label text-text-sub">{label}</span>
          )}
          {!label && showNumbers && numberPosition === 'left' && (
            <span className="text-label text-text-sub">{current} / {total}</span>
          )}
          {showNumbers && numberPosition === 'right' && (
            <span className="text-label text-text-sub font-medium">
              {current} / {total}
            </span>
          )}
          {label && labelPosition === 'right' && (
            <span className="text-body text-text-main font-medium">{label}</span>
          )}
        </div>
      )}

      {/* 프로그레스바 */}
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${backgroundColor}, ${borderColor})`,
            boxShadow: `0 2px 8px ${hexToRgba(borderColor, 0.3) || borderColor}`,
          }}
        >
          {/* 반짝이는 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
        {/* 0일 때 작은 인디케이터 */}
        {showZeroIndicator && current === 0 && (
          <div
            className="absolute left-0 top-0 w-1.5 h-full rounded-full"
            style={{
              backgroundColor,
              border: `1px solid ${borderColor}`,
            }}
          />
        )}
      </div>
    </div>
  )
}
