// 학습 큐 생성 로직
import type { JlptLevel } from '../../types/content'
import type { KanjiAliveEntry, NaverWord } from '@/data/types'
import type { UserCardState, StudyCard, StudyQueue } from '../../types/srs'
import { getReviewCards, getCardsByLevel, getAllCardIds } from '../../firebase/firestore'
import { logger } from '../../utils/logger'
import { getKanjiId } from '../../data/kanji/kanjiHelpers'
import {
  DEFAULT_DAILY_NEW_CARDS,
  MAX_REVIEW_CARDS_FETCH,
  REVIEW_CARD_RATIO,
  NEW_CARD_RATIO,
} from '../constants'

/**
 * 레벨 문자열을 JlptLevel로 변환
 */
function levelStringToJlptLevel(level: string): JlptLevel {
  const levelMap: Record<string, JlptLevel> = {
    '1': 'N1',
    '2': 'N2',
    '3': 'N3',
    '4': 'N4',
    '5': 'N5',
  }
  return levelMap[level] || 'N5'
}

/**
 * 오늘 학습 큐 생성
 */
export async function getTodayQueues(
  uid: string,
  level: JlptLevel,
  words: NaverWord[],
  kanjis: KanjiAliveEntry[],
  dailyNewLimit: number = DEFAULT_DAILY_NEW_CARDS
): Promise<StudyQueue> {
  logger.debug('[getTodayQueues] 시작:', { uid, level, wordsCount: words.length, kanjisCount: kanjis.length, dailyNewLimit })
  
  // 1. 복습 카드 큐 (Anki 기본: due 순서 처리)
  const reviewCardStates = await getReviewCards(uid, MAX_REVIEW_CARDS_FETCH)
  logger.debug('[getTodayQueues] 복습 카드 수:', reviewCardStates.length)
  const reviewCards: StudyCard[] = []

  // 복습 카드들을 NaverWord/Kanji 데이터와 매칭
  for (const cardState of reviewCardStates) {
    if (cardState.level !== level) continue

    if (cardState.type === 'word') {
      const word = words.find((w) => w.entry_id === cardState.itemId)
      if (word) {
        reviewCards.push({
          itemId: cardState.itemId,
          type: 'word',
          level: cardState.level,
          data: word,
          cardState,
        })
      } else {
        logger.warn('[getTodayQueues] 단어 매칭 실패:', cardState.itemId, 'words IDs:', words.slice(0, 5).map(w => w.entry_id))
      }
    } else {
      // 한자 매칭: ID 형식이 "N5_K_0001"이므로 레벨과 인덱스로 찾기
      const kanjiIdMatch = cardState.itemId.match(/^([N][1-5])_K_(\d+)$/)
      if (kanjiIdMatch) {
        const [, kanjiLevel, indexStr] = kanjiIdMatch
        const index = parseInt(indexStr, 10) - 1 // 1-based to 0-based
        if (index >= 0 && index < kanjis.length) {
          const kanji = kanjis[index]
          // 레벨도 확인 (안전장치)
          if (kanjiLevel === level) {
            reviewCards.push({
              itemId: cardState.itemId,
              type: 'kanji',
              level: cardState.level,
              data: kanji,
              cardState,
            })
          }
        } else {
          logger.warn('[getTodayQueues] 한자 인덱스 범위 초과:', cardState.itemId, 'index:', index, 'kanjis.length:', kanjis.length)
        }
      } else {
        logger.warn('[getTodayQueues] 한자 ID 형식 불일치:', cardState.itemId)
      }
    }
  }

  logger.debug('[getTodayQueues] 매칭된 복습 카드 수:', reviewCards.length)

  // due 오름차순 정렬 (가장 시급한 카드부터)
  reviewCards.sort((a, b) => {
    const aDue = a.cardState?.due ?? 0
    const bDue = b.cardState?.due ?? 0
    return aDue - bDue
  })

  // 2. 새 카드 큐
  const allCardIds = await getAllCardIds(uid)
  logger.debug('[getTodayQueues] 학습한 카드 ID 수:', allCardIds.size)
  const newCards: StudyCard[] = []

  // 단어 중 New 카드 찾기 (단어가 있는 경우)
  if (words.length > 0) {
    for (const word of words) {
      const wordLevel = levelStringToJlptLevel(word.level)
      if (wordLevel !== level) continue
      if (allCardIds.has(word.entry_id)) continue

      newCards.push({
        itemId: word.entry_id,
        type: 'word',
        level: wordLevel,
        data: word,
        cardState: null,
      })

      if (newCards.length >= dailyNewLimit) break
    }
  }

  logger.debug('[getTodayQueues] 새 단어 카드 수:', newCards.length)

  // 한자 중 New 카드 찾기 (단어가 부족하거나 단어가 없는 경우)
  if (newCards.length < dailyNewLimit && kanjis.length > 0) {
    for (let index = 0; index < kanjis.length; index++) {
      const kanji = kanjis[index]
      const kanjiId = getKanjiId(kanji, level, index)
      if (allCardIds.has(kanjiId)) continue

      newCards.push({
        itemId: kanjiId,
        type: 'kanji',
        level: level,
        data: kanji,
        cardState: null,
      })

      if (newCards.length >= dailyNewLimit) break
    }
  }

  logger.debug('[getTodayQueues] 최종 새 카드 수 (단어+한자):', newCards.length)

  // 3. 오늘 목표량(dailyNewLimit)만큼 선택: 복습:새 카드 비율 고정
  const TARGET = dailyNewLimit
  const reviewLimit = Math.floor(TARGET * REVIEW_CARD_RATIO)
  const newLimit = Math.floor(TARGET * NEW_CARD_RATIO)

  // 복습 선택 (due 오름차순으로 reviewLimit까지)
  const selectedReview = reviewCards.slice(0, reviewLimit)

  // 새 카드 선택: newLimit만큼, 부족하면 있는 만큼만
  // - 기본은 newLimit만큼
  // - 복습 카드가 모자라면 남는 슬롯을 새 카드로 채움
  const remainingSlots = TARGET - selectedReview.length
  const desiredNewCount = Math.max(newLimit, remainingSlots)
  const selectedNew = newCards.slice(0, desiredNewCount)

  // 순서 유지: 복습 → 새 카드
  const mixedQueue: StudyCard[] = [...selectedReview, ...selectedNew]

  return {
    reviewCards: selectedReview,
    newCards: selectedNew,
    mixedQueue,
  }
}

/**
 * 레벨별 진행률 계산
 */
export async function getLevelProgress(
  uid: string,
  level: JlptLevel,
  totalWords: number,
  totalKanjis: number
) {
  const allCardIds = await getAllCardIds(uid)
  const levelCards = await getCardsByLevel(uid, level)

  // 레벨별 카드 수 계산
  let learnedWords = 0
  let learnedKanjis = 0

  levelCards.forEach((card) => {
    if (card.type === 'word') {
      learnedWords++
    } else {
      learnedKanjis++
    }
  })

  return {
    totalWords,
    totalKanjis,
    learnedWords,
    learnedKanjis,
    wordProgress: totalWords > 0 ? (learnedWords / totalWords) * 100 : 0,
    kanjiProgress: totalKanjis > 0 ? (learnedKanjis / totalKanjis) * 100 : 0,
  }
}

