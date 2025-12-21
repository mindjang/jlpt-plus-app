'use client'

import { useEffect, useRef } from 'react'
import { Chart, ArcElement, Tooltip, DoughnutController } from 'chart.js'
import { hexToRgba } from '@/lib/utils/colorUtils'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface SemicircleProgressProps {
  value: number
  progress: number
  total: number
  color: string
  useChart?: boolean // 레거시 호환성
}

Chart.register(ArcElement, Tooltip, DoughnutController)

/**
 * 반원형 진행률 차트 컴포넌트 (Chart.js 버전)
 */
export function SemicircleProgress({ value, progress, total, color }: SemicircleProgressProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  // 간단한 hex -> rgba 변환 (hex가 아니면 기본 트랙 색상 사용)
  const trackColor = getTrackColor(color)
  const inactiveColor = '#F3F3F3' // 회색 비활성 트랙
  const activeBgColor = hexToRgba(color, 0.5) || color
  const activeBorderColor = color || LEVEL_COLORS.N5
  const percent = Math.min(Math.max(value, 0), 100)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [percent, Math.max(100 - percent, 0)],
            backgroundColor: [activeBgColor, inactiveColor],
            borderColor: [activeBorderColor, inactiveColor],
            borderWidth: [2, 0],
            spacing: 1, // 활성/비활성 사이 여백
            borderRadius: 0,
            circumference: 180, // 180도만 그리기
            rotation: -90, // 위쪽 반원 (왼쪽->오른쪽)
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: {
          duration: 300,
        },
        events: [], // 포인터 이벤트 불필요
        plugins: {
          tooltip: {
            enabled: false,
          },
          legend: {
            display: false,
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
    }
  }, [color, percent, trackColor])

  return (
    <div className="relative w-full flex-shrink-0" style={{ height: '7rem' }}>
      <div className="w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {/* 텍스트 오버레이 */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none z-10 pb-2">
        <span className="text-subtitle font-semibold text-text-main leading-tight drop-shadow-sm">
          {Math.round(percent)}%
        </span>
        <span className="text-label text-text-sub leading-tight drop-shadow-sm">
          {progress}/{total}
        </span>
      </div>
    </div>
  )
}

function getTrackColor(hexColor: string): string {
  const rgba = hexToRgba(hexColor, 0.25)
  return rgba || '#E5E7EB'
}
