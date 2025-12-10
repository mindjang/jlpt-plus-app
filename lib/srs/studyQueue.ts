// 학습 큐 생성 로직
import type { JlptLevel } from '../types/content'
import type { Word, Kanji } from '../types/content'
import type { UserCardState } from '../types/srs'
import { getReviewCards, getCardsByLevel, getAllCardIds } from '../firebase/firestore'

export interface StudyCard {
  itemId: string
  type: 'word' | 'kanji'
  level: JlptLevel
  data: Word | Kanji
  cardState: UserCardState | null // null이면 New 카드
}

export interface StudyQueue {
  reviewCards: StudyCard[]
  newCards: StudyCard[]
  mixedQueue: StudyCard[] // Anki 기본 순서: 복습(기한순) → 새 카드
}

/**
 * 오늘 학습 큐 생성
 */
export async function getTodayQueues(
  uid: string,
  level: JlptLevel,
  words: Word[],
  kanjis: Kanji[],
  dailyNewLimit: number = 10
): Promise<StudyQueue> {
  console.log('[getTodayQueues] 시작:', { uid, level, wordsCount: words.length, kanjisCount: kanjis.length, dailyNewLimit })
  
  // 1. 복습 카드 큐 (Anki 기본: due 순서 처리)
  const reviewCardStates = await getReviewCards(uid, 100)
  console.log('[getTodayQueues] 복습 카드 수:', reviewCardStates.length)
  const reviewCards: StudyCard[] = []

  // 복습 카드들을 Word/Kanji 데이터와 매칭
  for (const cardState of reviewCardStates) {
    if (cardState.level !== level) continue

    if (cardState.type === 'word') {
      const word = words.find((w) => w.id === cardState.itemId)
      if (word) {
        reviewCards.push({
          itemId: cardState.itemId,
          type: 'word',
          level: cardState.level,
          data: word,
          cardState,
        })
      } else {
        console.log('[getTodayQueues] 단어 매칭 실패:', cardState.itemId, 'words IDs:', words.slice(0, 5).map(w => w.id))
      }
    } else {
      const kanji = kanjis.find((k) => k.id === cardState.itemId)
      if (kanji) {
        reviewCards.push({
          itemId: cardState.itemId,
          type: 'kanji',
          level: cardState.level,
          data: kanji,
          cardState,
        })
      } else {
        console.log('[getTodayQueues] 한자 매칭 실패:', cardState.itemId)
      }
    }
  }

  console.log('[getTodayQueues] 매칭된 복습 카드 수:', reviewCards.length)

  // due 오름차순 정렬 (가장 시급한 카드부터)
  reviewCards.sort((a, b) => {
    const aDue = a.cardState?.due ?? 0
    const bDue = b.cardState?.due ?? 0
    return aDue - bDue
  })

  // 2. 새 카드 큐
  const allCardIds = await getAllCardIds(uid)
  console.log('[getTodayQueues] 학습한 카드 ID 수:', allCardIds.size)
  const newCards: StudyCard[] = []

  // 단어 중 New 카드 찾기 (단어가 있는 경우)
  if (words.length > 0) {
    for (const word of words) {
      if (word.level !== level) continue
      if (allCardIds.has(word.id)) continue

      newCards.push({
        itemId: word.id,
        type: 'word',
        level: word.level,
        data: word,
        cardState: null,
      })

      if (newCards.length >= dailyNewLimit) break
    }
  }

  console.log('[getTodayQueues] 새 단어 카드 수:', newCards.length)

  // 한자 중 New 카드 찾기 (단어가 부족하거나 단어가 없는 경우)
  if (newCards.length < dailyNewLimit && kanjis.length > 0) {
    for (const kanji of kanjis) {
      if (kanji.level !== level) continue
      if (allCardIds.has(kanji.id)) continue

      newCards.push({
        itemId: kanji.id,
        type: 'kanji',
        level: kanji.level,
        data: kanji,
        cardState: null,
      })

      if (newCards.length >= dailyNewLimit) break
    }
  }

  console.log('[getTodayQueues] 최종 새 카드 수 (단어+한자):', newCards.length)

  // 3. 오늘 목표량(dailyNewLimit)만큼 선택: 복습:새 카드 비율 고정 (70:30)
  const TARGET = dailyNewLimit
  const REVIEW_RATIO = 0.7  // 복습 카드 70%
  const NEW_RATIO = 0.3     // 새 카드 30%

  const reviewLimit = Math.floor(TARGET * REVIEW_RATIO)
  const newLimit = Math.floor(TARGET * NEW_RATIO)

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

