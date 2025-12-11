/**
 * 날짜/시간 유틸리티 함수
 * 일 단위와 분 단위 간 변환 및 날짜 처리
 */

const ONE_DAY_IN_MINUTES = 24 * 60

/**
 * 현재 시각을 분 단위로 반환 (epoch 분)
 */
export function nowAsMinutes(): number {
  return Math.floor(Date.now() / (1000 * 60))
}

/**
 * 일을 분으로 변환
 * @param days 일 수
 * @returns 분 수
 */
export function daysToMinutes(days: number): number {
  return days * ONE_DAY_IN_MINUTES
}

/**
 * 분을 일로 변환 (소수점 첫째 자리까지)
 * @param minutes 분 수
 * @returns 일 수
 */
export function minutesToDays(minutes: number): number {
  return Math.round(minutes / ONE_DAY_IN_MINUTES * 10) / 10
}

/**
 * 일 단위 정수를 분 단위로 변환
 * @param dayNumber 일 단위 정수 (1970-01-01부터의 일 수)
 * @returns 분 단위 정수 (epoch 분)
 */
export function dayNumberToMinutes(dayNumber: number): number {
  const epochStartMinutes = Math.floor(new Date('1970-01-01').getTime() / (1000 * 60))
  return epochStartMinutes + (dayNumber * ONE_DAY_IN_MINUTES)
}

/**
 * 분 단위를 일 단위 정수로 변환
 * @param minutes 분 단위 정수 (epoch 분)
 * @returns 일 단위 정수 (1970-01-01부터의 일 수)
 */
export function minutesToDayNumber(minutes: number): number {
  const epochStartMinutes = Math.floor(new Date('1970-01-01').getTime() / (1000 * 60))
  return Math.floor((minutes - epochStartMinutes) / ONE_DAY_IN_MINUTES)
}

/**
 * 오늘 날짜를 일 단위 정수로 반환
 * @returns 일 단위 정수 (1970-01-01부터의 일 수)
 */
export function todayAsDayNumber(): number {
  return minutesToDayNumber(nowAsMinutes())
}
