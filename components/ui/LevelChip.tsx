import React from 'react'

type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

interface LevelChipProps {
  level: Level
  className?: string
}

// tailwind.config.js의 level 색상 토큰 사용
// Tailwind가 빌드 타임에 인식할 수 있도록 명시적으로 클래스 정의
const levelBgColors: Record<Level, string> = {
  N1: 'bg-level-n1/10',
  N2: 'bg-level-n2/10',
  N3: 'bg-level-n3/10',
  N4: 'bg-level-n4/10',
  N5: 'bg-level-n5/10',
}

const levelTextColors: Record<Level, string> = {
  N1: 'text-level-n1',
  N2: 'text-level-n2',
  N3: 'text-level-n3',
  N4: 'text-level-n4',
  N5: 'text-level-n5',
}

export const LevelChip: React.FC<LevelChipProps> = ({ level, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-chip text-label font-bold ${levelBgColors[level]} ${levelTextColors[level]} ${className}`}
    >
      {level}
    </span>
  )
}


