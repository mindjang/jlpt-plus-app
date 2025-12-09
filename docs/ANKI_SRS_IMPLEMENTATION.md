# Anki 스타일 SRS 구현 가이드

## 📋 개요

이 문서는 JLPT 학습 웹앱에 적용된 Anki 스타일 SRS(Spaced Repetition System) 구현에 대한 상세 가이드입니다.

## 🏗️ 아키텍처 원칙

### 1. 콘텐츠 vs 상태 분리

- **콘텐츠**: 단어/한자/카나의 실제 데이터 (의미, 예문, 획순 등)
  - 저장 위치: `.ts` 파일, JSON, 로컬 데이터 구조
  - Firestore에 저장하지 않음

- **상태**: 사용자별 학습 진행 상태
  - 저장 위치: Firestore `/users/{uid}/cards/{cardId}`
  - SRS 알고리즘에 필요한 정보만 저장

### 2. 데이터 구조

#### UserCardState 인터페이스

```typescript
export interface UserCardState {
  itemId: string;        // 콘텐츠의 고유 ID (cardId와 동일)
  type: CardType;        // "word" | "kanji"
  level: JlptLevel;      // "N5" | "N4" | "N3" | "N2" | "N1" | null
  reps: number;          // 지금까지 학습(복습)한 횟수
  lapses: number;        // "again" 등으로 틀려서 리셋된 횟수
  interval: number;      // 다음 복습까지의 간격 (일 단위)
  ease: number;          // 난이도 계수 (기본 2.5, 최소 1.3)
  due: number;           // 다음 복습 예정일 (일 단위 정수)
  lastReviewed: number; // 마지막 복습일 (일 단위 정수)
  suspended?: boolean;  // leech 등으로 더 이상 보여주지 않을 때 true
}
```

#### Firestore 컬렉션 구조

```
/users/{uid}/cards/{cardId}
```

- `cardId`는 콘텐츠의 고유 ID를 그대로 사용
- 예: `"N5_W_0001"`, `"N5_K_0042"` 등

### 3. 카드 상태 해석 규칙

#### 새 카드 (New)
- `/users/{uid}/cards/{cardId}` 문서가 존재하지 않음
- `cardState === null`

#### 복습 카드 (Review)
- 문서는 있고, `due <= today` 인 카드
- `suspended !== true`

#### 장기 기억 카드 (Mastered)
- `interval >= 21일` 또는 `reps >= 8` 기준 충족

#### 문제아 (Leech)
- `lapses >= 5` → `suspended = true`로 처리

## 🔄 SRS 업데이트 로직

### Grade 타입

```typescript
type Grade = "again" | "hard" | "good" | "easy"
```

- **again**: 틀렸거나 거의 모름
- **hard**: 겨우 맞힘, 자신 없음
- **good**: 적당히 알고 있음
- **easy**: 매우 쉬움

### reviewCard 함수

```typescript
function reviewCard(
  prev: UserCardState | null,
  params: {
    itemId: string;
    type: CardType;
    level: JlptLevel;
    grade: Grade;
  }
): UserCardState
```

#### 로직 흐름

1. **새 카드 초기화**
   - `prev === null`이면 기본 상태 생성
   - `reps: 0`, `lapses: 0`, `interval: 0`, `ease: 2.5`

2. **공통 업데이트**
   - `reps += 1`
   - `lastReviewed = todayAsDayNumber()`

3. **again 처리**
   - `lapses += 1`
   - `interval = 1` (다음날 다시)
   - `due = nowDay + 1`
   - `ease = Math.max(1.3, ease - 0.2)`

4. **ease 조정**
   - `hard`: `ease = Math.max(1.3, ease - 0.15)`
   - `easy`: `ease = ease + 0.15`
   - `good`: ease 조정 없음

5. **interval 계산**
   - 첫 복습 (`interval === 0`):
     - `easy`: 2일
     - 그 외: 1일
   - 두 번째 복습 (`interval === 1`):
     - `easy`: 4일
     - 그 외: 3일
   - 세 번째 이후:
     - `interval = Math.round(interval * ease)` (SM-2 스타일)

6. **다음 복습 예정일**
   - `due = nowDay + interval`

7. **Leech 처리**
   - `lapses >= 5` → `suspended = true`

## 💾 DB 비용 최소화 전략

### 1. 콘텐츠는 Firestore에 저장하지 않음

- 단어/한자 데이터는 `.ts` 파일로 관리
- Firestore에는 `UserCardState`만 저장
- 읽기/쓰기 횟수와 저장 용량 대폭 절감

### 2. 상태로부터 카드 분류 계산

별도의 리스트를 저장하지 않고, 상태를 기반으로 계산:

```typescript
// 새 카드
function isNew(cardState: UserCardState | null): boolean {
  return cardState === null
}

// 복습 카드
function isReviewDue(cardState: UserCardState, today: number): boolean {
  return cardState.due <= today && !cardState.suspended
}

// 장기 기억 카드
function isMastered(cardState: UserCardState): boolean {
  return cardState.interval >= 21 || cardState.reps >= 8
}
```

### 3. 배치 업데이트

- 세션 중간에는 로컬 상태에만 저장
- 세션 종료 시 또는 N개 단위로 `writeBatch`로 한 번에 업데이트
- 쓰기 횟수 대폭 감소

```typescript
// StudySession.tsx에서 구현
const [pendingUpdates, setPendingUpdates] = useState<Map<string, UserCardState>>(new Map())

// 카드 평가 시
setPendingUpdates((prev) => {
  const next = new Map(prev)
  next.set(cardId, updatedState)
  return next
})

// 세션 종료 시 또는 5초마다
saveCardStatesBatch(user.uid, Array.from(pendingUpdates.values()))
```

### 4. 챕터 진행도 계산

- 챕터별 문서 없이도 진행 상황 계산 가능
- 레벨별 단어 배열을 학습량 단위로 chunk
- 각 chunk의 카드 상태를 확인하여 진행률 계산

### 5. 통계 페이지 읽기 전략

- `/users/{uid}/cards` 컬렉션을 한 번 읽어서 메모리에 로드
- 클라이언트 측에서 레벨별/타입별 그룹핑 및 집계
- 카드 수가 많아지면 레벨별/타입별로 쿼리 분리 고려

## 📁 파일 구조

```
lib/
├── srs/
│   ├── reviewCard.ts      # SRS 업데이트 로직
│   └── studyQueue.ts      # 학습 큐 생성 로직
├── types/
│   └── srs.ts             # SRS 타입 정의
└── firebase/
    └── firestore.ts       # Firestore CRUD 함수
```

## 🔍 현재 구현 상태

### ✅ 완료된 항목

1. **데이터 구조**
   - ✅ `UserCardState` 인터페이스 정의
   - ✅ Firestore 컬렉션 구조 (`/users/{uid}/cards/{cardId}`)
   - ✅ 콘텐츠와 상태 분리

2. **SRS 로직**
   - ✅ `reviewCard` 함수 구현
   - ✅ `todayAsDayNumber` 헬퍼 함수
   - ✅ Grade별 처리 로직 (again, hard, good, easy)
   - ✅ Leech 처리 (lapses >= 5)

3. **학습 큐**
   - ✅ 새 카드/복습 카드 분리
   - ✅ 복습 2개, 새 카드 1개 비율로 섞기
   - ✅ 랜덤 셔플

4. **DB 최적화**
   - ✅ 배치 업데이트 구현
   - ✅ 상태 기반 카드 분류
   - ✅ 콘텐츠는 Firestore에 저장하지 않음

### ✅ 완전히 일치

모든 항목이 명세와 일치합니다.

2. **CardType 확장**
   - 현재: `"word" | "kanji"`
   - 명세: `"word" | "kanji" | "kana"`
   - **향후**: 카나 학습 추가 시 확장 필요

3. **학습 모드 통합**
   - ✅ 예제 기반 플래시카드 모드
   - ✅ 객관식 문제풀기 모드
   - ⚠️ 한자 퀴즈, 카나 퀴즈 모드 (구현 필요)

## 📊 사용 예시

### 카드 평가 및 저장

```typescript
// 1. 현재 카드 상태 가져오기
const currentState = await getCardState(user.uid, cardId)

// 2. 사용자 평가에 따라 상태 업데이트
const updatedState = reviewCard(currentState, {
  itemId: cardId,
  type: 'word',
  level: 'N5',
  grade: 'good'
})

// 3. Firestore에 저장 (배치 업데이트 권장)
await saveCardState(user.uid, updatedState)
```

### 학습 큐 생성

```typescript
const queues = await getTodayQueues(
  user.uid,
  'N5',
  words,
  kanjis,
  10 // dailyNewLimit
)

// queues.mixedQueue 사용 (복습 2개, 새 카드 1개 비율)
```

### 카드 상태 확인

```typescript
// 새 카드인지 확인
const isNew = cardState === null

// 복습 필요한지 확인
const today = todayAsDayNumber()
const needsReview = cardState && cardState.due <= today && !cardState.suspended

// 장기 기억 카드인지 확인
const isMastered = cardState && (cardState.interval >= 21 || cardState.reps >= 8)
```

## 🎯 다음 단계

1. **카나 학습 모드 추가** (CardType 확장)
2. **통계 페이지 개선** (SRS 데이터 활용, lastReviewed 기반 학습 날짜 추적)
3. **성능 최적화** (대량 데이터 처리)

## 📚 참고 자료

- [Anki Manual - Spaced Repetition](https://docs.ankiweb.net/studying.html)
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

