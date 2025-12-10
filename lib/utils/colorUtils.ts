/**
 * 색상 유틸리티 함수
 */

/**
 * HEX 색상 코드를 RGBA 문자열로 변환
 * @param hex HEX 색상 코드 (예: "#FF0000" 또는 "#F00")
 * @param alpha 투명도 (0-1 사이의 값)
 * @returns RGBA 문자열 (예: "rgba(255, 0, 0, 0.5)")
 */
export function hexToRgba(hex: string, alpha: number): string {
  const trimmed = hex.replace('#', '')
  const normalized = trimmed.length === 3
    ? trimmed.split('').map((c) => c + c).join('')
    : trimmed
  const num = parseInt(normalized, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
