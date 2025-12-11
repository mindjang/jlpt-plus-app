# 카드 분류 알고리즘 문서

## 개요

Mogu-JLPT(MoguMogu JLPT 시험 대비 학습 앱)의 SRS(Spaced Repetition System)에서 사용하는 카드 분류 알고리즘을 설명합니다.
각 카테고리는 `UserCardState`의 필드값을 기반으로 판정됩니다.

---

## 1. 새 단어 (New Cards)

### 판정 조건

```
cardState === null
AND
itemId가 getAllCardIds()에 없음
```

### 표시 정보

- `itemId`: 카드 고유 ID
- `type`: "word" | "kanji"
- `level`: JLPT 레벨 (N5~N1)
- `data`: Word 또는 Kanji 객체 (실제 콘텐츠)
- `cardState`: `null` (아직 학습하지 않음)

### 선택 로직

1. 레벨 필터링: `word.level === targetLevel`
2. 학습 이력 없음: `!allCardIds.has(word.id)`
3. 일일 한도: `dailyNewLimit` (기본 10개)
4. 우선순위: 단어 → 한자 (단어가 부족하면 한자로 채움)

### 코드 위치

- `lib/srs/studyQueue.ts` - `getTodayQueues()` 함수
- `lib/firebase/firestore.ts` - `getAllCardIds()` 함수

---

## 2. 복습 단어 (Review Cards)

### 판정 조건

```
cardState !== null
AND
cardState.due <= nowMinutes (현재 시각)
AND
cardState.suspended === false
AND
cardState.interval < 30일 (43200분)
AND
cardState.reps < 12
```

### 표시 정보

- `itemId`: 카드 고유 ID
- `type`: "word" | "kanji"
- `level`: JLPT 레벨
- `data`: Word 또는 Kanji 객체
- `cardState`: UserCardState 객체
  - `reps`: 복습 횟수
  - `lapses`: 틀린 횟수
  - `interval`: 현재 복습 간격 (분 단위)
  - `due`: 다음 복습 예정 시각 (분 단위, epoch 분)
  - `ease`: 난이도 계수 (기본 2.5, 최소 1.3)
  - `lastReviewed`: 마지막 복습 시각 (분 단위)

### 선택 로직

1. 레벨 필터링: `cardState.level === targetLevel`
2. 정렬: `due` 오름차순 (가장 시급한 것부터)
3. 제한: 최대 100개 (기본값)
4. 제외: `suspended === true`인 카드 제외

### 코드 위치

- `lib/srs/studyQueue.ts` - `getTodayQueues()` 함수
- `lib/firebase/firestore.ts` - `getReviewCards()` 함수
- `lib/srs/cardStatus.ts` - `getCardStatus()` 함수

---

## 3. 장기 기억 단어 (Long-term Memory / Mastered Cards)

### 판정 조건

```
cardState !== null
AND
(
  cardState.interval >= 30일 (43200분)
  OR
  cardState.reps >= 12
)
AND
cardState.suspended === false
```

### 표시 정보

- `itemId`: 카드 고유 ID
- `type`: "word" | "kanji"
- `level`: JLPT 레벨
- `data`: Word 또는 Kanji 객체
- `cardState`: UserCardState 객체
  - `reps`: 복습 횟수 (12 이상)
  - `interval`: 복습 간격 (30일 이상, 분 단위)
  - `due`: 다음 복습 예정 시각
  - `ease`: 난이도 계수

### 의미

- 장기 기억으로 간주되는 카드
- 복습 큐에 자동 포함되지 않음 (due가 지나면 복습으로 전환)
- 학습 성취도가 높은 카드

### 코드 위치

- `lib/srs/cardStatus.ts` - `getCardStatus()` 함수

---

## 4. 학습한 단어 (Learned Cards)

### 판정 조건

```
cardState !== null
(즉, 한 번이라도 학습한 적이 있음)
```

### 표시 정보

- `itemId`: 카드 고유 ID
- `type`: "word" | "kanji"
- `level`: JLPT 레벨
- `data`: Word 또는 Kanji 객체
- `cardState`: UserCardState 객체
  - `reps`: 총 복습 횟수
  - `lapses`: 총 틀린 횟수
  - `interval`: 현재 복습 간격 (분 단위)
  - `due`: 다음 복습 예정 시각 (분 단위)
  - `lastReviewed`: 마지막 복습 시각 (분 단위)
  - `ease`: 난이도 계수

### 포함 범위

- 새 단어를 제외한 모든 카드
- 복습 단어 포함
- 장기 기억 단어 포함
- Leech 카드 포함 (suspended === true)

### 코드 위치

- `lib/firebase/firestore.ts` - `getCardsByLevel()` 함수
- `lib/srs/studyQueue.ts` - `getLevelProgress()` 함수

---

## 5. Leech 카드 (문제 카드)

### 판정 조건

```
cardState !== null
AND
cardState.lapses >= 8
AND
cardState.suspended === true
```

### 표시 정보

- 일반 학습한 단어와 동일
- `suspended: true`로 표시
- 복습 큐에서 제외됨

### 처리 로직

- `reviewCard()` 함수에서 `lapses >= 8`일 때 자동으로 `suspended = true` 설정 (일본어 학습에 맞춘 기준)
- 복습 큐 생성 시 `suspended === false` 조건으로 필터링

### 코드 위치

- `lib/srs/reviewCard.ts` - `reviewCard()` 함수
- `lib/firebase/firestore.ts` - `getReviewCards()` 함수

---

## 학습 큐 생성 로직 (getTodayQueues)

### 알고리즘

```
1. 복습 카드 수집
   - getReviewCards(uid, 100) 호출
   - 조건: due <= nowMinutes AND suspended === false
   - 레벨 필터링: cardState.level === targetLevel
   - 정렬: due 오름차순

2. 새 카드 수집
   - getAllCardIds(uid)로 학습한 카드 ID 목록 가져오기
   - 레벨별 단어/한자 중 ID가 없는 것 선택
   - 일일 한도: dailyNewLimit (기본 10개)
   - 우선순위: 단어 → 한자

3. 혼합 큐 생성
   - 복습:새 카드 비율 고정 (70:30)
   - 복습 카드 우선 (due 오름차순)
   - 순서: [복습 카드들..., 새 카드들...]
   - 총 개수: dailyNewLimit
```

### 코드 위치

- `lib/srs/studyQueue.ts` - `getTodayQueues()` 함수

---

## 카드 상태 전이 (State Transition)

### 학습 단계

```
[새 단어] (cardState === null)
  ↓ (첫 학습, grade: 'good'/'easy')
[학습 중] (reps=1, interval=4시간)
  ↓ (1일 후 통과, grade: 'good'/'easy')
[학습 중] (interval=1일)
  ↓ (3일 후 통과, grade: 'good'/'easy')
[복습 단계] (interval=3일, reps=2)
  ↓ (반복 학습, SM-2 알고리즘 적용)
[복습 단계] (interval 증가)
  ↓ (interval >= 30일 OR reps >= 12)
[장기 기억] (mastered)
```

### 오답 처리

```
[복습 단계]
  ↓ (grade: 'again')
[Lapse] (lapses 증가, interval 감소 - 현재 간격의 25%, 최소 1일)
  ↓ (lapses < 8)
[복습 단계] (재진입)
  ↓ (lapses >= 8)
[Leech] (suspended=true, 복습 큐에서 제외)
```

### 코드 위치

- `lib/srs/reviewCard.ts` - `reviewCard()` 함수
- `lib/srs/cardStatus.ts` - `getCardStatus()` 함수

---

## 학습 스텝 (Learning Steps)

### 정의

```typescript
const LEARNING_STEPS = [240, 1440, 4320] // 분 단위
// 4시간 → 1일 → 3일 (언어 학습 최적화)
```

### 적용 조건

```
isLearningPhase = card.reps <= 1 OR card.interval < 4320분 (3일)
```

### 진행 로직

1. **4시간 스텝**: 첫 학습 후 (단기 기억 강화)
2. **1일 스텝**: 4시간 스텝 통과 후 (장기 기억 전환)
3. **3일 스텝**: 1일 스텝 통과 후 (강화)
4. **SM-2 알고리즘**: 3일 이상부터 적용

### 코드 위치

- `lib/srs/reviewCard.ts` - `reviewCard()` 함수

---

## SM-2 알고리즘 (복습 단계)

### 적용 조건

```
card.reps > 1 AND card.interval >= 1440분 (1일)
```

### 간격 계산

```typescript
// 개선된 간격 계산 (망각 곡선 고려)
if (intervalInDays === 0) {
  // 첫 복습: easy는 3일, good/hard는 2일
  intervalInDays = grade === 'easy' ? 3 : 2
} else if (intervalInDays <= 2) {
  // 두 번째 복습: easy는 5일, good/hard는 3일
  intervalInDays = grade === 'easy' ? 5 : 3
} else if (intervalInDays <= 3) {
  // 세 번째 복습: easy는 7일, good/hard는 5일
  intervalInDays = grade === 'easy' ? 7 : 5
} else {
  // 네 번째 이후: SM-2 알고리즘 적용
  intervalInDays = Math.round(intervalInDays * ease)
}
```

### Ease Factor 조정

- `grade === 'again'`: ease - 0.2 (최소 1.3)
- `grade === 'hard'`: ease - 0.15 (최소 1.3)
- `grade === 'good'`: ease + 0.05 (학습 향상 반영, 최대 3.0)
- `grade === 'easy'`: ease + 0.15 (최대 3.0)

### 코드 위치

- `lib/srs/reviewCard.ts` - `reviewCard()` 함수

---

## UserCardState 구조

```typescript
interface UserCardState {
  itemId: string           // 카드 고유 ID
  type: CardType          // "word" | "kanji"
  level: JlptLevel        // "N5" | "N4" | "N3" | "N2" | "N1"
  
  reps: number            // 지금까지 복습 횟수
  lapses: number          // 틀려서 리셋된 횟수
  
  interval: number        // 다음 복습까지의 간격 (분 단위)
  ease: number           // 난이도 계수 (기본 2.5, 최소 1.3)
  due: number            // 다음 복습 예정 시각 (분 단위 정수, epoch 분)
  lastReviewed: number   // 마지막 복습 시각 (분 단위 정수, epoch 분)
  
  suspended?: boolean    // leech 처리 여부
}
```

### 코드 위치

- `lib/types/srs.ts`

---

## 주요 상수

```typescript
const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const ONE_DAY_IN_MINUTES = 24 * 60 = 1440
const MAX_INTERVAL_DAYS = 365
const MAX_INTERVAL_MINUTES = 365 * 1440 = 525600

// 학습 스텝 (언어 학습 최적화)
const LEARNING_STEPS = [240, 1440, 4320] // 4시간, 1일, 3일

// 장기 기억 판정 (실제 장기 기억 기준)
const MASTERED_INTERVAL_DAYS = 30
const MASTERED_INTERVAL_MINUTES = 30 * 1440 = 43200
const MASTERED_REPS = 12

// Leech 판정 (일본어 학습에 맞춘 기준)
const LEECH_LAPSES = 8
```

---

## 요약 테이블

| 카테고리 | 조건 | 주요 정보 | 복습 큐 포함 |
|---------|------|----------|------------|
| **새 단어** | `cardState === null` | itemId, type, level, data | ✅ (일일 한도 내, 30%) |
| **복습 단어** | `due <= now AND interval < 30일 AND reps < 12` | cardState (reps, interval, due, ease) | ✅ (우선순위, 70%) |
| **장기 기억** | `interval >= 30일 OR reps >= 12` | cardState (높은 interval/reps) | ❌ (due 지나면 복습으로 전환) |
| **학습한 단어** | `cardState !== null` | 모든 cardState 정보 | - (상위 집합) |
| **Leech** | `lapses >= 8 AND suspended === true` | cardState (suspended=true) | ❌ |

---

## 참고 파일

- `lib/types/srs.ts` - 타입 정의
- `lib/srs/reviewCard.ts` - 카드 복습 로직
- `lib/srs/studyQueue.ts` - 학습 큐 생성
- `lib/srs/cardStatus.ts` - 카드 상태 판정
- `lib/firebase/firestore.ts` - Firestore CRUD 함수
- `.cursorrules` - SRS 구현 규칙

---

## 업데이트 이력

- 2024-12-XX: 초기 문서 작성
