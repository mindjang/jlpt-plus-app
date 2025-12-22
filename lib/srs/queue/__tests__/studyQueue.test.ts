/**
 * 학습 큐 생성 로직 테스트
 * dailyNewLimit 준수 및 비율 적용 검증
 */

import { getTodayQueues } from '../studyQueue'
import type { UserCardState, StudyCard } from '../../../types/srs'
import type { NaverWord, KanjiAliveEntry } from '@/data/types'
import { nowAsMinutes, daysToMinutes } from '../../../utils/date/dateUtils'
import { REVIEW_CARD_RATIO, NEW_CARD_RATIO, DEFAULT_DAILY_NEW_CARDS, MAX_REVIEW_CARDS_FETCH } from '../../constants/srs/queue'

// Firestore 모킹 (최소)
const mockGetReviewCards = jest.fn()
const mockGetCardsByLevel = jest.fn()
const mockGetAllCardIds = jest.fn()

jest.mock('../../firebase/firestore', () => ({
  getReviewCards: (...args: any[]) => mockGetReviewCards(...args),
  getCardsByLevel: (...args: any[]) => mockGetCardsByLevel(...args),
  getAllCardIds: (...args: any[]) => mockGetAllCardIds(...args),
}))

describe('getTodayQueues', () => {
  const mockWords: NaverWord[] = Array.from({ length: 100 }, (_, i) => ({
    entry_id: `word-${i}`,
    entry: `word${i}`,
    level: '5',
    kanji: `word${i}`,
    kana: `word${i}`,
    meaning: `meaning${i}`,
    partsMeans: [],
  } as NaverWord))

  const mockKanjis: KanjiAliveEntry[] = Array.from({ length: 50 }, (_, i) => ({
    ka_utf: `漢${i}`,
    grade: 1,
    kanji: {} as any,
    radical: {} as any,
  } as KanjiAliveEntry))

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAllCardIds.mockResolvedValue(new Set())
  })

  describe('C) overdue 0/10/100/500 상황에서 getTodayQueues()가 dailyNewLimit를 넘지 않음', () => {
    const testCases = [
      { overdueCount: 0, dailyNewLimit: 10 },
      { overdueCount: 10, dailyNewLimit: 10 },
      { overdueCount: 100, dailyNewLimit: 10 },
      { overdueCount: 500, dailyNewLimit: 10 },
      { overdueCount: 0, dailyNewLimit: 20 },
      { overdueCount: 100, dailyNewLimit: 20 },
    ]

    testCases.forEach(({ overdueCount, dailyNewLimit }) => {
      it(`overdue ${overdueCount}개, dailyNewLimit ${dailyNewLimit}일 때 큐가 dailyNewLimit를 넘지 않아야 함`, async () => {
        const nowMinutes = nowAsMinutes()
        
        // overdue 카드 생성
        const reviewCards: UserCardState[] = Array.from({ length: overdueCount }, (_, i) => ({
          itemId: `review-${i}`,
          type: 'word' as const,
          level: 'N5' as const,
          reps: 5,
          lapses: 0,
          interval: daysToMinutes(5),
          ease: 2.5,
          due: nowMinutes - (i * 100), // 과거 시간
          lastReviewed: nowMinutes - (i * 100) - daysToMinutes(5),
          suspended: false,
        }))

        mockGetReviewCards.mockResolvedValue(reviewCards)

        const result = await getTodayQueues(
          'test-uid',
          'N5',
          mockWords,
          mockKanjis,
          dailyNewLimit
        )

        // 큐 총 길이가 dailyNewLimit를 넘지 않아야 함
        expect(result.mixedQueue.length).toBeLessThanOrEqual(dailyNewLimit)
        expect(result.reviewCards.length + result.newCards.length).toBeLessThanOrEqual(dailyNewLimit)
      })
    })
  })

  describe('D) REVIEW_CARD_RATIO(0.7) 적용이 정확', () => {
    it('dailyNewLimit이 10일 때 복습 카드는 7개, 새 카드는 3개여야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      // 충분한 복습 카드 제공
      const reviewCards: UserCardState[] = Array.from({ length: 20 }, (_, i) => ({
        itemId: `review-${i}`,
        type: 'word' as const,
        level: 'N5' as const,
        reps: 5,
        lapses: 0,
        interval: daysToMinutes(5),
        ease: 2.5,
        due: nowMinutes - (i * 100),
        lastReviewed: nowMinutes - (i * 100) - daysToMinutes(5),
        suspended: false,
      }))

      mockGetReviewCards.mockResolvedValue(reviewCards)

      const dailyNewLimit = 10
      const result = await getTodayQueues(
        'test-uid',
        'N5',
        mockWords,
        mockKanjis,
        dailyNewLimit
      )

      const expectedReview = Math.floor(dailyNewLimit * REVIEW_CARD_RATIO) // 7
      const expectedNew = Math.floor(dailyNewLimit * NEW_CARD_RATIO) // 3

      expect(result.reviewCards.length).toBe(expectedReview)
      expect(result.newCards.length).toBe(expectedNew)
      expect(result.mixedQueue.length).toBe(expectedReview + expectedNew)
    })

    it('dailyNewLimit이 20일 때 복습 카드는 14개, 새 카드는 6개여야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      const reviewCards: UserCardState[] = Array.from({ length: 30 }, (_, i) => ({
        itemId: `review-${i}`,
        type: 'word' as const,
        level: 'N5' as const,
        reps: 5,
        lapses: 0,
        interval: daysToMinutes(5),
        ease: 2.5,
        due: nowMinutes - (i * 100),
        lastReviewed: nowMinutes - (i * 100) - daysToMinutes(5),
        suspended: false,
      }))

      mockGetReviewCards.mockResolvedValue(reviewCards)

      const dailyNewLimit = 20
      const result = await getTodayQueues(
        'test-uid',
        'N5',
        mockWords,
        mockKanjis,
        dailyNewLimit
      )

      const expectedReview = Math.floor(dailyNewLimit * REVIEW_CARD_RATIO) // 14
      const expectedNew = Math.floor(dailyNewLimit * NEW_CARD_RATIO) // 6

      expect(result.reviewCards.length).toBe(expectedReview)
      expect(result.newCards.length).toBe(expectedNew)
    })

    it('복습 카드가 부족하면 새 카드로 채워야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      // 복습 카드가 부족한 경우 (3개만)
      const reviewCards: UserCardState[] = Array.from({ length: 3 }, (_, i) => ({
        itemId: `review-${i}`,
        type: 'word' as const,
        level: 'N5' as const,
        reps: 5,
        lapses: 0,
        interval: daysToMinutes(5),
        ease: 2.5,
        due: nowMinutes - (i * 100),
        lastReviewed: nowMinutes - (i * 100) - daysToMinutes(5),
        suspended: false,
      }))

      mockGetReviewCards.mockResolvedValue(reviewCards)

      const dailyNewLimit = 10
      const result = await getTodayQueues(
        'test-uid',
        'N5',
        mockWords,
        mockKanjis,
        dailyNewLimit
      )

      // 복습 카드가 부족하면 새 카드로 채워야 함
      expect(result.reviewCards.length).toBe(3)
      expect(result.newCards.length).toBeGreaterThanOrEqual(Math.floor(dailyNewLimit * NEW_CARD_RATIO))
      expect(result.mixedQueue.length).toBeLessThanOrEqual(dailyNewLimit)
    })

    it('MAX_REVIEW_CARDS_FETCH(100) 이상의 overdue가 있어도 조회는 100개로 제한되어야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      // 500개의 overdue 카드
      const reviewCards: UserCardState[] = Array.from({ length: 500 }, (_, i) => ({
        itemId: `review-${i}`,
        type: 'word' as const,
        level: 'N5' as const,
        reps: 5,
        lapses: 0,
        interval: daysToMinutes(5),
        ease: 2.5,
        due: nowMinutes - (i * 100),
        lastReviewed: nowMinutes - (i * 100) - daysToMinutes(5),
        suspended: false,
      }))

      // getReviewCards는 최대 100개만 반환
      mockGetReviewCards.mockResolvedValue(reviewCards.slice(0, MAX_REVIEW_CARDS_FETCH))

      const dailyNewLimit = 10
      const result = await getTodayQueues(
        'test-uid',
        'N5',
        mockWords,
        mockKanjis,
        dailyNewLimit
      )

      // 큐는 dailyNewLimit를 넘지 않아야 함
      expect(result.mixedQueue.length).toBeLessThanOrEqual(dailyNewLimit)
      // getReviewCards가 100개로 제한되었는지 확인 (간접 확인)
      expect(mockGetReviewCards).toHaveBeenCalledWith('test-uid', MAX_REVIEW_CARDS_FETCH)
    })
  })
})

