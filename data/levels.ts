import { Level, LevelData, LevelGradient } from './types'
import { LEVEL_GRADIENTS, getLevelGradient as getLevelGradientFromConstants } from '@/lib/constants/colors'

// 레벨별 단어/한자 수 (실제 데이터 기준)
export const levelData: Record<Level, LevelData> = {
  N5: { words: 715, kanji: 80 },
  N4: { words: 967, kanji: 166 },
  N3: { words: 1506, kanji: 367 },
  N2: { words: 2401, kanji: 367 },
  N1: { words: 2676, kanji: 1232 },
}

// 레벨별 그라데이션 색상 (상수 파일에서 가져옴)
export const levelGradients: Record<Level, LevelGradient> = LEVEL_GRADIENTS

// 레벨 순서 (N5부터 N1까지)
export const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// 레벨 문자열을 Level 타입으로 변환하여 그라데이션 가져오기
// @deprecated getLevelGradientFromConstants 사용 권장
export const getLevelGradient = (level: string): LevelGradient => {
  return getLevelGradientFromConstants(level)
}

