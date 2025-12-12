import { Level, LevelData, LevelGradient } from './types'

// 레벨별 단어/한자 수 (실제 데이터 기준)
export const levelData: Record<Level, LevelData> = {
  N5: { words: 715, kanji: 80 },
  N4: { words: 967, kanji: 166 },
  N3: { words: 1506, kanji: 367 },
  N2: { words: 2401, kanji: 367 },
  N1: { words: 2676, kanji: 1232 },
}

// 레벨별 그라데이션 색상
export const levelGradients: Record<Level, LevelGradient> = {
  N1: { from: '#E9F4FF', to: '#D9E9FF' },
  N2: { from: '#EEE8FF', to: '#D9D0FF' },
  N3: { from: '#FFECEC', to: '#FFD4D4' },
  N4: { from: '#FFEFE8', to: '#FFDCC8' },
  N5: { from: '#FFF4D8', to: '#FFE8B3' },
}

// 레벨 순서 (N5부터 N1까지)
export const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// 레벨 문자열을 Level 타입으로 변환
export const getLevelGradient = (level: string): LevelGradient => {
  const normalizedLevel = level.toLowerCase()
  const levelMap: Record<string, Level> = {
    n1: 'N1',
    n2: 'N2',
    n3: 'N3',
    n4: 'N4',
    n5: 'N5',
  }
  const levelKey = levelMap[normalizedLevel] || 'N5'
  return levelGradients[levelKey]
}

