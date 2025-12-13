/**
 * 학습 통계 계산 로직
 * 학습 세션 완료 후 통계 계산에 사용
 */
import type { StudyCard } from '../../types/srs'
import type { StudySessionStats } from '../../types/study'

/**
 * 학습 세션 통계 계산
 * @param queue 학습 큐
 * @param studyTime 학습 시간 (초)
 * @returns 학습 통계
 */
export function calculateStudyStats(
  queue: StudyCard[],
  studyTime: number
): StudySessionStats {
  const newCards = queue.filter((card) => card.cardState === null).length
  const reviewCards = queue.length - newCards

  return {
    totalCards: queue.length,
    newCards,
    reviewCards,
    studyTime,
  }
}

/**
 * 시간 포맷팅 (초 → "X분 Y초")
 * @param seconds 초
 * @returns 포맷된 시간 문자열
 */
export function formatStudyTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}분 ${secs}초`
}

