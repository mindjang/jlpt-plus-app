/**
 * 레벨별 컬러 상수 정의
 * 
 * JLPT 레벨(N5, N4, N3, N2, N1)별로 사용되는 모든 컬러를 통합 관리
 * 단색, 그라데이션, 텍스트 컬러 등 모든 변형을 포함
 */

import type { Level } from '@/data/types'
import { hexToRgba } from '@/lib/utils/colorUtils'

/**
 * 색상 밝기 조절 (어둡게)
 * @param hex Hex 색상 코드
 * @param factor 조절 비율 (0-1, 기본: 0.15)
 * @returns 조절된 Hex 색상 코드
 */
function darkenColor(hex: string, factor: number = 0.15): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) * (1 - factor)))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) * (1 - factor)))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) * (1 - factor)))
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * 색상 밝기 조절 (밝게)
 * @param hex Hex 색상 코드
 * @param factor 조절 비율 (0-1, 기본: 0.15)
 * @returns 조절된 Hex 색상 코드
 */
function lightenColor(hex: string, factor: number = 0.15): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * factor)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * factor)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * factor)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * 그라데이션용 매우 밝은 색상 생성
 * LEVEL_COLORS에서 배경 그라데이션용 연한 색상을 생성
 * @param hex Hex 색상 코드
 * @param lightness 밝기 조절 (0-1, 기본: 0.92 - 매우 밝게)
 * @returns 매우 밝은 Hex 색상 코드
 */
function generateLightGradientColor(hex: string, lightness: number = 0.92): string {
  // 원본 색상을 매우 밝게 만들어서 그라데이션 from 색상으로 사용
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * lightness)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * lightness)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * lightness)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * 그라데이션용 중간 밝기 색상 생성
 * LEVEL_COLORS에서 배경 그라데이션용 중간 밝기 색상을 생성
 * @param hex Hex 색상 코드
 * @param lightness 밝기 조절 (0-1, 기본: 0.85)
 * @returns 중간 밝기 Hex 색상 코드
 */
function generateMediumGradientColor(hex: string, lightness: number = 0.85): string {
  // 원본 색상을 중간 밝기로 만들어서 그라데이션 to 색상으로 사용
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * lightness)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * lightness)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * lightness)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * 레벨별 단색 (Primary Color)
 * 주로 칩, 텍스트, 강조 요소에 사용
 */
export const LEVEL_COLORS: Record<Level, string> = {
  N5: '#FF8C00', // 밝은 주황 (가장 쉬움)
  N4: '#FF6B35', // 오렌지-빨강
  N3: '#E63946', // 빨강
  N2: '#6A4C93', // 보라
  N1: '#1E88E5', // 파랑 (가장 어려움)
}

/**
 * 레벨별 그라데이션 (Background Gradient)
 * 배경, 카드 등에 사용되는 그라데이션 색상
 * LEVEL_COLORS에서 자동 생성 (매우 밝은 톤)
 */
export const LEVEL_GRADIENTS: Record<Level, { from: string; to: string }> = {
  N5: { 
    from: generateLightGradientColor(LEVEL_COLORS.N5, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N5, 0.85) 
  },
  N4: { 
    from: generateLightGradientColor(LEVEL_COLORS.N4, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N4, 0.85) 
  },
  N3: { 
    from: generateLightGradientColor(LEVEL_COLORS.N3, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N3, 0.85) 
  },
  N2: { 
    from: generateLightGradientColor(LEVEL_COLORS.N2, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N2, 0.85) 
  },
  N1: { 
    from: generateLightGradientColor(LEVEL_COLORS.N1, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N1, 0.85) 
  },
}

/**
 * 레벨별 흰색으로 가는 그라데이션 (To White Gradient)
 * 도서관 학습 시작 버튼 등에 사용되는 그라데이션
 * 레벨 컬러에서 흰색으로 자연스럽게 전환
 * LEVEL_COLORS에서 자동 생성
 */
export const LEVEL_GRADIENTS_TO_WHITE: Record<Level, { from: string; to: string }> = {
  N5: { from: generateLightGradientColor(LEVEL_COLORS.N5, 0.92), to: '#FFFFFF' },
  N4: { from: generateLightGradientColor(LEVEL_COLORS.N4, 0.92), to: '#FFFFFF' },
  N3: { from: generateLightGradientColor(LEVEL_COLORS.N3, 0.92), to: '#FFFFFF' },
  N2: { from: generateLightGradientColor(LEVEL_COLORS.N2, 0.92), to: '#FFFFFF' },
  N1: { from: generateLightGradientColor(LEVEL_COLORS.N1, 0.92), to: '#FFFFFF' },
}

/**
 * 레벨별 그라데이션 CSS 문자열 생성
 * @param level 레벨
 * @param direction 그라데이션 방향 (기본: 135deg)
 * @param toWhite 흰색으로 가는 그라데이션 사용 여부 (기본: false)
 * @returns CSS linear-gradient 문자열
 */
export const getLevelGradientCSS = (
  level: Level,
  direction: string = '135deg',
  toWhite: boolean = false
): string => {
  const gradient = toWhite ? LEVEL_GRADIENTS_TO_WHITE[level] : LEVEL_GRADIENTS[level]
  return `linear-gradient(${direction}, ${gradient.from} 0%, ${gradient.to} 100%)`
}

/**
 * 레벨별 그라데이션 Tailwind 클래스
 * Tailwind의 bg-gradient-to-* 클래스와 함께 사용
 * LEVEL_GRADIENTS에서 자동 생성
 */
export const LEVEL_GRADIENT_CLASSES: Record<Level, { from: string; to: string }> = {
  N5: { from: `from-[${LEVEL_GRADIENTS.N5.from}]`, to: `to-[${LEVEL_GRADIENTS.N5.to}]` },
  N4: { from: `from-[${LEVEL_GRADIENTS.N4.from}]`, to: `to-[${LEVEL_GRADIENTS.N4.to}]` },
  N3: { from: `from-[${LEVEL_GRADIENTS.N3.from}]`, to: `to-[${LEVEL_GRADIENTS.N3.to}]` },
  N2: { from: `from-[${LEVEL_GRADIENTS.N2.from}]`, to: `to-[${LEVEL_GRADIENTS.N2.to}]` },
  N1: { from: `from-[${LEVEL_GRADIENTS.N1.from}]`, to: `to-[${LEVEL_GRADIENTS.N1.to}]` },
}

/**
 * 레벨별 흰색으로 가는 그라데이션 Tailwind 클래스
 * Tailwind의 bg-gradient-to-* 클래스와 함께 사용
 * LEVEL_GRADIENTS_TO_WHITE에서 자동 생성
 */
export const LEVEL_GRADIENT_TO_WHITE_CLASSES: Record<Level, { from: string; to: string }> = {
  N5: { from: `from-[${LEVEL_GRADIENTS_TO_WHITE.N5.from}]`, to: 'to-white' },
  N4: { from: `from-[${LEVEL_GRADIENTS_TO_WHITE.N4.from}]`, to: 'to-white' },
  N3: { from: `from-[${LEVEL_GRADIENTS_TO_WHITE.N3.from}]`, to: 'to-white' },
  N2: { from: `from-[${LEVEL_GRADIENTS_TO_WHITE.N2.from}]`, to: 'to-white' },
  N1: { from: `from-[${LEVEL_GRADIENTS_TO_WHITE.N1.from}]`, to: 'to-white' },
}

/**
 * 레벨별 텍스트 컬러
 * 텍스트에 사용되는 컬러 (단색과 동일)
 */
export const LEVEL_TEXT_COLORS: Record<Level, string> = LEVEL_COLORS

/**
 * 레벨별 배경 컬러 (단색의 투명도 버전)
 * 배경에 사용되는 연한 컬러
 * LEVEL_COLORS에서 자동 계산
 */
export const LEVEL_BG_COLORS: Record<Level, string> = {
  N5: hexToRgba(LEVEL_COLORS.N5, 0.1),
  N4: hexToRgba(LEVEL_COLORS.N4, 0.1),
  N3: hexToRgba(LEVEL_COLORS.N3, 0.1),
  N2: hexToRgba(LEVEL_COLORS.N2, 0.1),
  N1: hexToRgba(LEVEL_COLORS.N1, 0.1),
}

/**
 * 레벨별 보더 컬러
 * 보더에 사용되는 컬러 (단색과 동일)
 */
export const LEVEL_BORDER_COLORS: Record<Level, string> = LEVEL_COLORS

/**
 * 레벨별 호버 컬러 (단색의 어두운 버전)
 * 호버 상태에 사용되는 컬러
 * LEVEL_COLORS에서 자동 계산 (15% 어둡게)
 */
export const LEVEL_HOVER_COLORS: Record<Level, string> = {
  N5: darkenColor(LEVEL_COLORS.N5, 0.15),
  N4: darkenColor(LEVEL_COLORS.N4, 0.15),
  N3: darkenColor(LEVEL_COLORS.N3, 0.15),
  N2: darkenColor(LEVEL_COLORS.N2, 0.15),
  N1: darkenColor(LEVEL_COLORS.N1, 0.15),
}

/**
 * 레벨별 활성 컬러 (단색의 밝은 버전)
 * 활성 상태에 사용되는 컬러
 * LEVEL_COLORS에서 자동 계산 (15% 밝게)
 */
export const LEVEL_ACTIVE_COLORS: Record<Level, string> = {
  N5: lightenColor(LEVEL_COLORS.N5, 0.15),
  N4: lightenColor(LEVEL_COLORS.N4, 0.15),
  N3: lightenColor(LEVEL_COLORS.N3, 0.15),
  N2: lightenColor(LEVEL_COLORS.N2, 0.15),
  N1: lightenColor(LEVEL_COLORS.N1, 0.15),
}

/**
 * 레벨 문자열을 Level 타입으로 변환하여 컬러 가져오기
 * @param level 레벨 문자열 (대소문자 무관)
 * @returns Level 타입
 */
export const normalizeLevel = (level: string): Level => {
  const normalized = level.toUpperCase()
  const levelMap: Record<string, Level> = {
    N1: 'N1',
    N2: 'N2',
    N3: 'N3',
    N4: 'N4',
    N5: 'N5',
  }
  return levelMap[normalized] || 'N5'
}

/**
 * 레벨별 컬러 정보 전체 객체
 * 모든 컬러 변형을 한 곳에서 관리
 */
export const LEVEL_COLOR_PALETTE: Record<
  Level,
  {
    primary: string
    gradient: { from: string; to: string }
    gradientToWhite: { from: string; to: string }
    text: string
    bg: string
    border: string
    hover: string
    active: string
  }
> = {
  N5: {
    primary: LEVEL_COLORS.N5,
    gradient: LEVEL_GRADIENTS.N5,
    gradientToWhite: LEVEL_GRADIENTS_TO_WHITE.N5,
    text: LEVEL_TEXT_COLORS.N5,
    bg: LEVEL_BG_COLORS.N5,
    border: LEVEL_BORDER_COLORS.N5,
    hover: LEVEL_HOVER_COLORS.N5,
    active: LEVEL_ACTIVE_COLORS.N5,
  },
  N4: {
    primary: LEVEL_COLORS.N4,
    gradient: LEVEL_GRADIENTS.N4,
    gradientToWhite: LEVEL_GRADIENTS_TO_WHITE.N4,
    text: LEVEL_TEXT_COLORS.N4,
    bg: LEVEL_BG_COLORS.N4,
    border: LEVEL_BORDER_COLORS.N4,
    hover: LEVEL_HOVER_COLORS.N4,
    active: LEVEL_ACTIVE_COLORS.N4,
  },
  N3: {
    primary: LEVEL_COLORS.N3,
    gradient: LEVEL_GRADIENTS.N3,
    gradientToWhite: LEVEL_GRADIENTS_TO_WHITE.N3,
    text: LEVEL_TEXT_COLORS.N3,
    bg: LEVEL_BG_COLORS.N3,
    border: LEVEL_BORDER_COLORS.N3,
    hover: LEVEL_HOVER_COLORS.N3,
    active: LEVEL_ACTIVE_COLORS.N3,
  },
  N2: {
    primary: LEVEL_COLORS.N2,
    gradient: LEVEL_GRADIENTS.N2,
    gradientToWhite: LEVEL_GRADIENTS_TO_WHITE.N2,
    text: LEVEL_TEXT_COLORS.N2,
    bg: LEVEL_BG_COLORS.N2,
    border: LEVEL_BORDER_COLORS.N2,
    hover: LEVEL_HOVER_COLORS.N2,
    active: LEVEL_ACTIVE_COLORS.N2,
  },
  N1: {
    primary: LEVEL_COLORS.N1,
    gradient: LEVEL_GRADIENTS.N1,
    gradientToWhite: LEVEL_GRADIENTS_TO_WHITE.N1,
    text: LEVEL_TEXT_COLORS.N1,
    bg: LEVEL_BG_COLORS.N1,
    border: LEVEL_BORDER_COLORS.N1,
    hover: LEVEL_HOVER_COLORS.N1,
    active: LEVEL_ACTIVE_COLORS.N1,
  },
}

/**
 * 레벨별 컬러 가져오기 헬퍼 함수
 * @param level 레벨 문자열
 * @param type 컬러 타입
 * @returns 컬러 값
 */
export const getLevelColor = (
  level: string,
  type: 'primary' | 'text' | 'bg' | 'border' | 'hover' | 'active' = 'primary'
): string => {
  const normalized = normalizeLevel(level)
  const palette = LEVEL_COLOR_PALETTE[normalized]
  return palette[type]
}

/**
 * 레벨별 그라데이션 가져오기 헬퍼 함수
 * @param level 레벨 문자열
 * @param toWhite 흰색으로 가는 그라데이션 사용 여부 (기본: false)
 * @returns 그라데이션 객체
 */
export const getLevelGradient = (
  level: string,
  toWhite: boolean = false
): { from: string; to: string } => {
  const normalized = normalizeLevel(level)
  return toWhite ? LEVEL_GRADIENTS_TO_WHITE[normalized] : LEVEL_GRADIENTS[normalized]
}

