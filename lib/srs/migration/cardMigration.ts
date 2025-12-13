/**
 * 카드 상태 마이그레이션 유틸리티
 * 일 단위 형식 → 분 단위 형식으로 변환
 */
import type { UserCardState } from '../../types/srs'
import { dayNumberToMinutes, daysToMinutes } from '../../utils/date/dateUtils'

/**
 * 레거시 형식인지 확인 (일 단위로 저장된 경우)
 * @param value 확인할 값
 * @returns 레거시 형식 여부 (10000 미만이면 일 단위로 간주)
 */
export function isLegacyFormat(value: number): boolean {
  return value < 10000
}

/**
 * 카드 상태를 분 단위 형식으로 마이그레이션
 * @param card 카드 상태
 * @returns 마이그레이션된 카드 상태 (이미 분 단위면 그대로 반환)
 */
export function migrateCardState(card: UserCardState): UserCardState {
  const migrated = { ...card }

  // due 마이그레이션 (일 단위 → 분 단위)
  if (isLegacyFormat(card.due)) {
    migrated.due = dayNumberToMinutes(card.due)
  }

  // lastReviewed 마이그레이션 (일 단위 → 분 단위)
  if (isLegacyFormat(card.lastReviewed)) {
    migrated.lastReviewed = dayNumberToMinutes(card.lastReviewed)
  }

  // interval 마이그레이션 (일 단위 → 분 단위)
  // 365일 미만이면 일 단위로 간주 (365일 = 525600분)
  if (card.interval < 365) {
    migrated.interval = daysToMinutes(card.interval)
  }

  return migrated
}

/**
 * 카드 상태를 정규화 (마이그레이션 필요 시 수행)
 * @param card 카드 상태 (null 가능)
 * @returns 정규화된 카드 상태 또는 null
 */
export function normalizeCardState(card: UserCardState | null): UserCardState | null {
  if (!card) {
    return null
  }

  // 마이그레이션이 필요한지 확인
  const needsMigration =
    isLegacyFormat(card.due) ||
    isLegacyFormat(card.lastReviewed) ||
    card.interval < 365

  if (needsMigration) {
    return migrateCardState(card)
  }

  return card
}

/**
 * due 값을 분 단위로 변환 (레거시 형식 처리)
 * @param due due 값
 * @returns 분 단위 due 값
 */
export function normalizeDue(due: number): number {
  if (isLegacyFormat(due)) {
    return dayNumberToMinutes(due)
  }
  return due
}

/**
 * interval 값을 분 단위로 변환 (레거시 형식 처리)
 * @param interval interval 값
 * @returns 분 단위 interval 값
 */
export function normalizeInterval(interval: number): number {
  if (interval < 365) {
    return daysToMinutes(interval)
  }
  return interval
}
