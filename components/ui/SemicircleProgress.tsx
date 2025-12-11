'use client'

interface SemicircleProgressProps {
  value: number
  progress: number
  total: number
  color: string
  useChart?: boolean // 레거시 호환성 (무시됨)
}

/**
 * 반원형 진행률 차트 컴포넌트 (SVG 버전)
 * Chart.js를 제거하고 경량 SVG 구현만 사용합니다.
 */
export function SemicircleProgress({
  value,
  progress,
  total,
  color,
}: SemicircleProgressProps) {
  return <SemicircleProgressSVG value={value} progress={progress} total={total} color={color} />
}

// SVG 구현 (가볍고 의존성 없음)
function SemicircleProgressSVG({
  value,
  progress,
  total,
  color,
}: SemicircleProgressProps) {
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
