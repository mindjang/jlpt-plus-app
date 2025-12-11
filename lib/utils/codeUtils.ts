/**
 * 쿠폰 코드 관련 유틸리티 함수
 */

/**
 * 랜덤 쿠폰 코드 생성
 * @param length 코드 길이 (기본값: 8)
 * @param includeHyphen 하이픈 포함 여부 (기본값: false)
 * @returns 생성된 코드 문자열
 */
export function generateRandomCode(length: number = 8, includeHyphen: boolean = false): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''

  for (let i = 0; i < length; i++) {
    // 하이픈 포함 모드이고 중간 지점이면 하이픈 추가
    if (includeHyphen && i === length / 2 && length % 2 === 0) {
      code += '-'
    } else {
      const randomIndex = Math.floor(Math.random() * chars.length)
      code += chars[randomIndex]
    }
  }

  return code
}

/**
 * 코드 형식 검증
 * @param code 검증할 코드
 * @returns 유효한 코드인지 여부
 */
export function validateCodeFormat(code: string): boolean {
  // 하이픈 제거 후 검증
  const cleanCode = code.replace(/-/g, '')
  // 8자리 대문자 알파벳과 숫자만 허용
  return /^[A-Z0-9]{8}$/.test(cleanCode)
}

/**
 * 코드 포맷팅 (하이픈 추가)
 * @param code 포맷팅할 코드
 * @returns 포맷팅된 코드 (예: ABCD-1234)
 */
export function formatCode(code: string): string {
  const cleanCode = code.replace(/-/g, '').toUpperCase()
  if (cleanCode.length === 8) {
    return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`
  }
  return cleanCode
}
