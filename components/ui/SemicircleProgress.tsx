'use client'

import React, { useRef, useEffect } from 'react'
import type { Chart as ChartType, ChartData, ChartOptions } from 'chart.js'
import { hexToRgba } from '@/lib/utils/colorUtils'

interface SemicircleProgressProps {
  value: number
  progress: number
  total: number
  color: string
  useChart?: boolean // Chart.js 사용 여부 (기본값: false, SVG 사용)
}

/**
 * 반원형 진행률 차트 컴포넌트
 * 기본적으로 SVG를 사용하며, useChart=true일 경우 Chart.js를 사용합니다.
 */
export function SemicircleProgress({
  value,
  progress,
  total,
  color,
  useChart = false,
}: SemicircleProgressProps) {
  // Chart.js 버전
  if (useChart) {
    return <SemicircleProgressChart value={value} progress={progress} total={total} color={color} />
  }

  // SVG 버전 (기본)
  return <SemicircleProgressSVG value={value} progress={progress} total={total} color={color} />
}

// SVG 구현 (가볍고 의존성 없음)
function SemicircleProgressSVG({
  value,
  progress,
  total,
  color,
}: Omit<SemicircleProgressProps, 'useChart'>) {
  const radius = 80
  const centerX = 100
  const centerY = 100
  const strokeWidth = 32

  // 반원 경로 계산 (왼쪽에서 오른쪽으로)
  const startAngle = Math.PI // 180도 (왼쪽)
  const endAngle = 0 // 0도 (오른쪽)
  const currentAngle = startAngle - (value / 100) * (startAngle - endAngle)

  // 시작점과 끝점 좌표
  const startX = centerX - radius
  const startY = centerY
  const endX = centerX + radius
  const endY = centerY

  // 현재 진행률에 따른 끝점
  const currentX = centerX + radius * Math.cos(currentAngle)
  const currentY = centerY - radius * Math.sin(currentAngle)

  // 큰 호인지 작은 호인지 결정 (50% 이상이면 큰 호)
  const largeArcFlag = value >= 50 ? 1 : 0

  // 진행률 경로
  const progressPath =
    value > 0
      ? `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${currentX} ${currentY}`
      : ''

  return (
    <div className="relative w-full flex-shrink-0" style={{ height: '7rem' }}>
      <svg
        className="w-full h-full"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        {/* 배경 반원 (회색) */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="#F3F3F3"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* 진행률 반원 (레벨 컬러 30% opacity) */}
        {progressPath && (
          <path
            d={progressPath}
            fill="none"
            stroke={color}
            strokeOpacity={0.3}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
      {/* 텍스트 오버레이 */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none z-10 pb-2">
        <span className="text-subtitle font-semibold text-text-main leading-tight">
          {Math.round(value)}%
        </span>
        <span className="text-label text-text-sub leading-tight">
          {progress}/{total}
        </span>
      </div>
    </div>
  )
}

// Chart.js 구현 (애니메이션 있음)
function SemicircleProgressChart({
  value,
  progress,
  total,
  color,
}: Omit<SemicircleProgressProps, 'useChart'>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartType<'doughnut'> | null>(null)

  const safePercent = Math.min(Math.max(value, 0), 100)
  const completedCount = Math.max(Math.min(progress, total), 0)
  const remainingCount = Math.max(total - completedCount, 0)

  useEffect(() => {
    let isMounted = true

    const renderChart = async () => {
      const { Chart } = await import('chart.js/auto')
      if (!canvasRef.current || !isMounted) return

      // 난이도 컬러 사용 (채우기) + 20% 투명도의 테두리
      const primaryColor = hexToRgba(color, 0.3)
      const primaryBorder = '#FF8A00'
      const restBorder = hexToRgba('#E5E7EB', 0)

      const data: ChartData<'doughnut'> = {
        labels: ['완료', '남음'],
        datasets: [
          {
            data: [completedCount, remainingCount],
            backgroundColor: [primaryColor, '#E5E7EB'],
            borderColor: [primaryBorder, restBorder],
            borderWidth: 1,
            hoverOffset: 0,
          },
        ],
      }

      const options: ChartOptions<'doughnut'> = {
        cutout: '60%',
        rotation: -90,
        circumference: 180,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: {
          duration: 400,
        },
      }

      chartRef.current?.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data,
        options,
      })
    }

    renderChart()

    return () => {
      isMounted = false
      chartRef.current?.destroy()
    }
  }, [completedCount, remainingCount, total, color])

  return (
    <div className="relative w-full h-36">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pointer-events-none z-10 pb-7">
        <span className="text-subtitle font-semibold text-text-main leading-tight">
          {Math.round(safePercent)}%
        </span>
        <span className="text-label text-text-sub leading-tight">
          {completedCount}/{total}
        </span>
      </div>
    </div>
  )
}
