# lib 폴더 재구성 제안

## 📁 새로운 폴더 구조

```
lib/
├── types/                          # 모든 타입 정의
│   ├── content.ts                  # 콘텐츠 타입 (JlptLevel)
│   ├── srs.ts                      # SRS 관련 타입
│   │   ├── UserCardState
│   │   ├── CardType
│   │   ├── Grade
│   │   ├── CardStatus
│   │   ├── ReviewParams
│   │   ├── StudyCard              # studyQueue.ts에서 이동
│   │   └── StudyQueue             # studyQueue.ts에서 이동
│   ├── stats.ts                    # 통계 관련 타입
│   │   ├── LevelStats
│   │   ├── ProgressStats          # progressCalculation.ts에서 이동
│   │   └── RoundProgress          # progressCalculation.ts에서 이동
│   ├── user.ts                     # 유저 관련 타입
│   ├── membership.ts               # 멤버십 관련 타입
│   └── study.ts                    # 학습 관련 타입 (신규)
│       ├── EvaluationResult       # cardEvaluation.ts에서 이동
│       └── StudySessionStats      # studyStats.ts에서 이동
│
├── constants/                      # 모든 상수 정의
│   ├── time.ts                    # 시간 관련 상수 (신규)
│   │   ├── ONE_DAY_IN_MINUTES
│   │   ├── ONE_HOUR_IN_MINUTES
│   │   ├── ONE_WEEK_IN_MINUTES
│   │   └── ONE_MONTH_IN_MINUTES
│   ├── srs/                       # SRS 상수 분리
│   │   ├── ease.ts                # Ease Factor 관련
│   │   │   ├── DEFAULT_EASE
│   │   │   ├── MIN_EASE
│   │   │   ├── MAX_EASE
│   │   │   ├── EASE_AGAIN_PENALTY
│   │   │   ├── EASE_HARD_PENALTY
│   │   │   ├── EASE_GOOD_BONUS
│   │   │   └── EASE_EASY_BONUS
│   │   ├── intervals.ts           # 간격 관련
│   │   │   ├── LEARNING_STEP_1_MINUTES
│   │   │   ├── LEARNING_STEP_2_MINUTES
│   │   │   ├── LEARNING_STEP_3_MINUTES
│   │   │   ├── FIRST_REVIEW_EASY_DAYS
│   │   │   ├── FIRST_REVIEW_NORMAL_DAYS
│   │   │   ├── SECOND_REVIEW_EASY_DAYS
│   │   │   ├── SECOND_REVIEW_NORMAL_DAYS
│   │   │   ├── THIRD_REVIEW_EASY_DAYS
│   │   │   ├── THIRD_REVIEW_NORMAL_DAYS
│   │   │   ├── MAX_INTERVAL_DAYS
│   │   │   ├── MAX_INTERVAL_MINUTES
│   │   │   ├── LONG_TERM_MEMORY_INTERVAL_DAYS
│   │   │   └── INTERVAL_THRESHOLDS
│   │   ├── queue.ts               # 큐 관련
│   │   │   ├── DEFAULT_DAILY_NEW_CARDS
│   │   │   ├── MAX_REVIEW_CARDS_FETCH
│   │   │   ├── REVIEW_CARD_RATIO
│   │   │   └── NEW_CARD_RATIO
│   │   └── index.ts               # 모든 SRS 상수 re-export
│   ├── ui.ts                       # UI 관련 상수 (기존 유지)
│   └── membership.ts               # 멤버십 관련 상수 (신규)
│       ├── CACHE_TTL
│       └── CODE_LENGTH
│
├── utils/                          # 범용 유틸리티
│   ├── date/                       # 날짜/시간 유틸리티
│   │   ├── dateUtils.ts           # 기존 dateUtils.ts (ONE_DAY_IN_MINUTES import 사용)
│   │   └── timeFormatters.ts      # 시간 포맷팅 함수 (신규)
│   │       └── formatStudyTime    # studyStats.ts에서 이동
│   ├── error/                      # 에러 처리
│   │   ├── errorHandler.ts        # 기존 errorHandler.ts
│   │   └── errorTypes.ts          # 에러 타입 정의 (신규)
│   │       └── AppError           # errorHandler.ts에서 이동
│   ├── color/                      # 색상 유틸리티
│   │   └── colorUtils.ts          # 기존 colorUtils.ts
│   ├── code/                       # 코드 생성/검증
│   │   └── codeUtils.ts           # 기존 codeUtils.ts (membership 관련이지만 범용 유틸로 유지)
│   └── logger.ts                   # 로깅 유틸리티
│
├── data/                           # 데이터 관련 헬퍼 (신규)
│   ├── kanji/                      # 한자 데이터 헬퍼
│   │   └── kanjiHelpers.ts        # utils/kanjiHelpers.ts에서 이동
│   │       ├── getKanjiCharacter
│   │       ├── getOnYomi
│   │       ├── getKunYomi
│   │       ├── getKanjiMeaning
│   │       ├── getRadical
│   │       ├── getStrokeCount
│   │       ├── getRelatedWords
│   │       ├── getFirstMeaning
│   │       └── getKanjiId
│   └── word/                       # 단어 데이터 헬퍼 (신규, 확장용)
│       └── wordHelpers.ts
│
├── srs/                            # SRS 알고리즘 로직
│   ├── core/                       # 핵심 SRS 로직
│   │   ├── reviewCard.ts          # 기존 reviewCard.ts (dateUtils 직접 import)
│   │   └── cardStatus.ts          # 기존 cardStatus.ts
│   ├── queue/                      # 큐 관리
│   │   └── studyQueue.ts          # 기존 studyQueue.ts (타입 제거)
│   ├── evaluation/                 # 평가 및 업데이트
│   │   └── cardEvaluation.ts      # 기존 cardEvaluation.ts (타입 제거)
│   ├── progress/                   # 진행률 계산
│   │   ├── progressCalculation.ts # 기존 progressCalculation.ts (타입 제거)
│   │   └── studyStats.ts          # 기존 studyStats.ts (타입 제거)
│   ├── migration/                  # 마이그레이션
│   │   └── cardMigration.ts       # 기존 cardMigration.ts
│   └── index.ts                    # 모든 SRS 함수 re-export
│
├── firebase/                       # Firebase 관련
│   ├── config.ts                   # Firebase 설정
│   ├── auth.ts                     # 인증
│   ├── auth-middleware.ts          # 인증 미들웨어
│   ├── admin.ts                    # Admin SDK
│   └── firestore/                  # Firestore 분리
│       ├── cards.ts                # 카드 관련 CRUD
│       │   ├── saveCardState
│       │   ├── saveCardStatesBatch
│       │   ├── getCardState
│       │   ├── getReviewCards
│       │   ├── getCardsByLevel
│       │   └── getAllCardIds
│       ├── users.ts                # 유저 관련 CRUD
│       │   ├── createUserDocument
│       │   ├── getUserData
│       │   ├── updateUserProfile
│       │   └── updateUserSettings
│       ├── membership.ts           # 멤버십 관련 CRUD
│       │   ├── getMembership
│       │   ├── updateMembership
│       │   ├── getDailyUsage
│       │   ├── updateDailyUsage
│       │   ├── getGiftCode
│       │   ├── redeemGiftCode
│       │   └── getBillingInfo
│       ├── stats.ts                # 통계 관련 CRUD
│       │   ├── getLevelStats
│       │   ├── updateLevelStats
│       │   └── calculateLevelStats
│       └── index.ts                # 모든 Firestore 함수 re-export
│
└── membership/                     # 멤버십 관련 유틸리티 (신규, 확장용)
    └── utils.ts                    # 멤버십 전용 유틸 (향후 확장)
```

## 📝 주요 변경 사항

### 1. 타입 정의 통합 (`lib/types/`)
- **목적**: 모든 타입 정의를 한 곳에 모아 관리
- **변경**:
  - `StudyCard`, `StudyQueue` → `types/srs.ts`
  - `EvaluationResult` → `types/study.ts`
  - `ProgressStats`, `RoundProgress` → `types/stats.ts`
  - `StudySessionStats` → `types/study.ts`
  - `AppError` → `types/error.ts` (신규)

### 2. 상수 정리 (`lib/constants/`)
- **목적**: 중복 제거 및 카테고리별 분리
- **변경**:
  - `ONE_DAY_IN_MINUTES` 중복 제거 → `constants/time.ts`로 통합
  - SRS 상수를 `ease.ts`, `intervals.ts`, `queue.ts`로 분리
  - 시간 관련 상수 통합 (`time.ts`)

### 3. 유틸리티 재구성 (`lib/utils/`)
- **목적**: 기능별 분류 및 확장성 향상
- **변경**:
  - `kanjiHelpers.ts` → `data/kanji/kanjiHelpers.ts`로 이동
  - 날짜/시간 유틸을 `date/` 폴더로 그룹화
  - 에러 처리를 `error/` 폴더로 그룹화

### 4. SRS 로직 재구성 (`lib/srs/`)
- **목적**: 기능별 분리 및 가독성 향상
- **변경**:
  - `core/`: 핵심 알고리즘
  - `queue/`: 큐 관리
  - `evaluation/`: 평가 로직
  - `progress/`: 진행률 계산
  - `migration/`: 마이그레이션

### 5. Firestore 분리 (`lib/firebase/firestore/`)
- **목적**: 큰 파일 분리 및 유지보수성 향상
- **변경**:
  - `cards.ts`: 카드 관련 (약 200줄)
  - `users.ts`: 유저 관련 (약 150줄)
  - `membership.ts`: 멤버십 관련 (약 200줄)
  - `stats.ts`: 통계 관련 (약 150줄)

## 🔧 각 파일별 기능 목록

### `lib/types/srs.ts`
```typescript
// 기존 + 추가
- CardType
- Grade
- UserCardState
- CardStatus
- ReviewParams
- StudyCard          // studyQueue.ts에서 이동
- StudyQueue         // studyQueue.ts에서 이동
```

### `lib/types/study.ts` (신규)
```typescript
- EvaluationResult   // cardEvaluation.ts에서 이동
- StudySessionStats  // studyStats.ts에서 이동
```

### `lib/types/stats.ts`
```typescript
// 기존 + 추가
- LevelStats
- ProgressStats      // progressCalculation.ts에서 이동
- RoundProgress      // progressCalculation.ts에서 이동
```

### `lib/constants/time.ts` (신규)
```typescript
- ONE_DAY_IN_MINUTES
- ONE_HOUR_IN_MINUTES
- ONE_WEEK_IN_MINUTES
- ONE_MONTH_IN_MINUTES
- ONE_YEAR_IN_MINUTES
```

### `lib/constants/srs/ease.ts` (신규)
```typescript
- DEFAULT_EASE
- MIN_EASE
- MAX_EASE
- EASE_AGAIN_PENALTY
- EASE_HARD_PENALTY
- EASE_GOOD_BONUS
- EASE_EASY_BONUS
```

### `lib/constants/srs/intervals.ts` (신규)
```typescript
- LEARNING_STEP_1_MINUTES
- LEARNING_STEP_2_MINUTES
- LEARNING_STEP_3_MINUTES
- FIRST_REVIEW_EASY_DAYS
- FIRST_REVIEW_NORMAL_DAYS
- SECOND_REVIEW_EASY_DAYS
- SECOND_REVIEW_NORMAL_DAYS
- THIRD_REVIEW_EASY_DAYS
- THIRD_REVIEW_NORMAL_DAYS
- LAPSE_REDUCTION_FACTOR
- LEECH_THRESHOLD
- MAX_INTERVAL_DAYS
- MAX_INTERVAL_MINUTES
- LONG_TERM_MEMORY_INTERVAL_DAYS
- LONG_TERM_MEMORY_REPS
- INTERVAL_THRESHOLDS
```

### `lib/constants/srs/queue.ts` (신규)
```typescript
- DEFAULT_DAILY_NEW_CARDS
- MAX_REVIEW_CARDS_FETCH
- REVIEW_CARD_RATIO
- NEW_CARD_RATIO
```

### `lib/utils/date/dateUtils.ts`
```typescript
// 기존 함수들 (ONE_DAY_IN_MINUTES는 constants/time.ts에서 import)
- nowAsMinutes()
- daysToMinutes()
- minutesToDays()
- dayNumberToMinutes()
- minutesToDayNumber()
```

### `lib/utils/date/timeFormatters.ts` (신규)
```typescript
- formatStudyTime()  // studyStats.ts에서 이동
```

### `lib/data/kanji/kanjiHelpers.ts`
```typescript
// utils/kanjiHelpers.ts에서 이동
- getKanjiCharacter()
- getOnYomi()
- getKunYomi()
- getKanjiMeaning()
- getRadical()
- getStrokeCount()
- getRelatedWords()
- getFirstMeaning()
- getKanjiId()
```

### `lib/srs/core/reviewCard.ts`
```typescript
// 기존 함수 (dateUtils 직접 import, constants에서 상수 import)
- reviewCard()
```

### `lib/srs/core/cardStatus.ts`
```typescript
// 기존 함수
- getCardStatus()
```

### `lib/srs/queue/studyQueue.ts`
```typescript
// 타입 제거, 함수만 유지
- getTodayQueues()
- getLevelProgress()
```

### `lib/srs/evaluation/cardEvaluation.ts`
```typescript
// 타입 제거, 함수만 유지
- evaluateCard()
- updateQueueAfterEvaluation()
- saveCardStateImmediate()
- addToPendingUpdates()
- savePendingUpdates()
```

### `lib/srs/progress/progressCalculation.ts`
```typescript
// 타입 제거, 함수만 유지
- isLongTermMemory()
- isStudiedToday()
- calculateProgressStats()
- calculateRoundProgress()
- calculateChapterProgress()
```

### `lib/srs/progress/studyStats.ts`
```typescript
// 타입 제거, 함수만 유지
- calculateStudyStats()
// formatStudyTime()은 utils/date/timeFormatters.ts로 이동
```

### `lib/firebase/firestore/cards.ts` (신규)
```typescript
- saveCardState()
- saveCardStatesBatch()
- getCardState()
- getReviewCards()
- getCardsByLevel()
- getAllCardIds()
```

### `lib/firebase/firestore/users.ts` (신규)
```typescript
- createUserDocument()
- getUserData()
- updateUserProfile()
- updateUserSettings()
```

### `lib/firebase/firestore/membership.ts` (신규)
```typescript
- getMembership()
- updateMembership()
- getDailyUsage()
- updateDailyUsage()
- getGiftCode()
- redeemGiftCode()
- getBillingInfo()
- updateBillingInfo()
```

### `lib/firebase/firestore/stats.ts` (신규)
```typescript
- getLevelStats()
- updateLevelStats()
- calculateLevelStats()
```

## 🎯 확장성 개선

### CardType 확장 준비
- `CardType`을 `types/srs.ts`에서 중앙 관리
- 모든 하드코딩된 `'word' | 'kanji'`를 `CardType`으로 교체
- 새로운 타입 추가 시 한 곳만 수정

### 데이터 헬퍼 확장 준비
- `data/kanji/` 구조로 한자 헬퍼 분리
- `data/word/` 폴더 추가로 단어 헬퍼 확장 가능
- 향후 `data/kana/` 등 추가 용이

### 상수 관리 개선
- 시간 상수를 `constants/time.ts`로 통합
- SRS 상수를 카테고리별로 분리
- 재사용성 및 유지보수성 향상

## 📊 예상 효과

1. **중복 제거**: `ONE_DAY_IN_MINUTES` 중복 제거
2. **타입 관리**: 모든 타입을 `types/` 폴더에서 중앙 관리
3. **파일 크기**: 큰 파일 분리로 가독성 향상
4. **확장성**: 새로운 카드 타입/데이터 타입 추가 용이
5. **유지보수**: 기능별 분리로 수정 범위 최소화

