/**
 * Firestore 카드 조회 로직 테스트
 * due 필터링 및 suspended 카드 제외 검증
 */

import type { UserCardState } from '../../../types/srs'
import { nowAsMinutes, daysToMinutes } from '../../../utils/date/dateUtils'

// Firestore 모킹 (최소)
const mockWhere = jest.fn((field, op, value) => ({ field, op, value }))
const mockOrderBy = jest.fn((field, dir) => ({ field, dir }))
const mockLimit = jest.fn((n) => ({ limit: n }))
const mockQuery = jest.fn((...args) => args)
const mockGetDocs = jest.fn()
const mockCollection = jest.fn()

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (field: string, op: string, value: any) => mockWhere(field, op, value),
  orderBy: (field: string, dir?: string) => mockOrderBy(field, dir),
  limit: (n: number) => mockLimit(n),
  getDocs: (q: any) => mockGetDocs(q),
}))

jest.mock('../utils', () => ({
  getDbInstance: jest.fn(() => ({
    collection: mockCollection,
  })),
}))

// getReviewCards를 모킹 후 import
let getReviewCards: typeof import('../cards').getReviewCards

describe('getReviewCards', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // 동적 import로 getReviewCards 가져오기
    const cardsModule = await import('../cards')
    getReviewCards = cardsModule.getReviewCards
  })

  describe('A) due 단위(분) 기준으로 due <= nowMinutes 필터가 동작', () => {
    it('due가 현재 시간(분 단위) 이하인 카드만 조회해야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      // 모킹된 쿼리 결과
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // due가 과거인 카드 (포함되어야 함)
          callback({
            id: 'card-1',
            data: () => ({
              itemId: 'card-1',
              type: 'word',
              level: 'N5',
              reps: 1,
              lapses: 0,
              interval: daysToMinutes(1),
              ease: 2.5,
              due: nowMinutes - 100, // 100분 전
              lastReviewed: nowMinutes - 200,
              suspended: false,
            } as UserCardState),
          })
          // due가 현재 시간인 카드 (포함되어야 함)
          callback({
            id: 'card-2',
            data: () => ({
              itemId: 'card-2',
              type: 'word',
              level: 'N5',
              reps: 1,
              lapses: 0,
              interval: daysToMinutes(1),
              ease: 2.5,
              due: nowMinutes, // 현재 시간
              lastReviewed: nowMinutes - 100,
              suspended: false,
            } as UserCardState),
          })
        }),
      }
      
      mockGetDocs.mockResolvedValue(mockSnapshot)
      
      const result = await getReviewCards('test-uid', 100)
      
      // 쿼리에 due <= nowMinutes 조건이 포함되어야 함
      const whereCalls = mockWhere.mock.calls
      const dueFilter = whereCalls.find((call) => call[0] === 'due' && call[1] === '<=' && call[2] <= nowMinutes)
      
      expect(dueFilter).toBeDefined()
      expect(dueFilter[2]).toBeLessThanOrEqual(nowMinutes)
      expect(result.length).toBe(2)
    })

    it('due가 미래인 카드는 조회되지 않아야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // due가 미래인 카드는 forEach에서 제외됨 (Firestore 쿼리가 필터링)
        }),
      }
      
      mockGetDocs.mockResolvedValue(mockSnapshot)
      
      const result = await getReviewCards('test-uid', 100)
      
      // 쿼리에 due <= nowMinutes 조건이 포함되어야 함
      const whereCalls = mockWhere.mock.calls
      const dueFilter = whereCalls.find((call) => call[0] === 'due' && call[1] === '<=')
      
      expect(dueFilter).toBeDefined()
      expect(dueFilter[2]).toBeLessThanOrEqual(nowMinutes)
      expect(result.length).toBe(0)
    })
  })

  describe('B) suspended 카드가 큐에서 제외', () => {
    it('suspended가 false인 카드만 조회되어야 함', async () => {
      const nowMinutes = nowAsMinutes()
      
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // suspended가 false인 카드만 포함됨 (Firestore 쿼리가 필터링)
          callback({
            id: 'card-1',
            data: () => ({
              itemId: 'card-1',
              type: 'word',
              level: 'N5',
              reps: 1,
              lapses: 0,
              interval: daysToMinutes(1),
              ease: 2.5,
              due: nowMinutes - 100,
              lastReviewed: nowMinutes - 200,
              suspended: false,
            } as UserCardState),
          })
        }),
      }
      
      mockGetDocs.mockResolvedValue(mockSnapshot)
      
      const result = await getReviewCards('test-uid', 100)
      
      // 쿼리에 suspended == false 조건이 포함되어야 함
      const whereCalls = mockWhere.mock.calls
      const suspendedFilter = whereCalls.find((call) => call[0] === 'suspended' && call[1] === '==' && call[2] === false)
      
      expect(suspendedFilter).toBeDefined()
      expect(result.length).toBe(1)
      expect(result[0].suspended).toBe(false)
    })

    it('suspended가 true인 카드는 쿼리에서 제외되어야 함', async () => {
      const mockSnapshot = {
        forEach: jest.fn(() => {
          // suspended가 true인 카드는 forEach에서 제외됨 (Firestore 쿼리가 필터링)
        }),
      }
      
      mockGetDocs.mockResolvedValue(mockSnapshot)
      
      await getReviewCards('test-uid', 100)
      
      // 쿼리에 suspended == false 조건이 포함되어야 함
      const whereCalls = mockWhere.mock.calls
      const suspendedFilter = whereCalls.find((call) => call[0] === 'suspended' && call[1] === '==')
      
      expect(suspendedFilter).toBeDefined()
      expect(suspendedFilter[2]).toBe(false)
    })
  })
})

