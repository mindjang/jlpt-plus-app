# SRS 알고리즘 전문가 피드백

## 🔴 언어학습학자 & 공부 천재 관점에서의 분석

---

## 🔴 심각한 문제점 (Critical Issues)

### 1. 학습 스텝 간격이 너무 짧음

**현재 구현:**
```typescript
const LEARNING_STEPS = [1, 10, 1440] // 1분, 10분, 1일
```

**문제점:**
- **1분 간격**: 같은 세션 내에서만 의미 있음. 실제 학습 효과 없음
- **10분 간격**: 단기 기억에만 의존. 장기 기억 전환 실패
- **언어학습 이론**: 최소 4-6시간 간격 필요 (단기 → 장기 기억 전환)

**개선 제안:**
```typescript
// 언어 학습에 최적화된 학습 스텝
const LEARNING_STEPS = [
  4 * 60,      // 4시간 (단기 기억 강화)
  24 * 60,     // 1일 (장기 기억 전환)
  3 * 24 * 60  // 3일 (강화)
]
```

**이유:**
- **4시간**: 단기 기억이 장기 기억으로 전환되는 최소 시간
- **1일**: 첫 번째 장기 기억 강화
- **3일**: 두 번째 강화 (망각 곡선 고려)

---

### 2. 첫 복습 간격이 너무 짧음

**현재 구현:**
```typescript
if (intervalInDays === 0) {
  intervalInDays = params.grade === 'easy' ? 2 : 1
}
```

**문제점:**
- 첫 복습이 1일 후 → 너무 빠름
- 언어 학습에서는 최소 2-3일 후 첫 복습이 효과적
- Ebbinghaus 망각 곡선: 24시간 후 50% 망각, 48시간 후 70% 망각

**개선 제안:**
```typescript
if (intervalInDays === 0) {
  // 첫 복습: easy는 3일, good/hard는 2일
  intervalInDays = params.grade === 'easy' ? 3 : 2
}
```

---

### 3. 장기 기억 판정 기준이 너무 낮음

**현재 구현:**
```typescript
// Mastered: interval >= 21일 또는 reps >= 8
if (intervalMinutes >= twentyOneDaysInMinutes || card.reps >= 8) {
  return 'mastered'
}
```

**문제점:**
- **21일**: 실제 장기 기억은 최소 30-60일 필요
- **reps >= 8**: 너무 낮음. 최소 10-15회 필요
- 조기 "mastered" 판정으로 복습 기회 상실

**개선 제안:**
```typescript
// 실제 장기 기억 기준
const LONG_TERM_MEMORY_DAYS = 30  // 최소 30일
const MASTERED_REPS = 12           // 최소 12회

if (intervalMinutes >= daysToMinutes(LONG_TERM_MEMORY_DAYS) || card.reps >= MASTERED_REPS) {
  return 'mastered'
}
```

**이유:**
- **30일**: 실제 장기 기억으로 간주되는 최소 기간
- **12회**: 충분한 반복 학습 횟수

---

### 4. Leech 판정이 너무 엄격함

**현재 구현:**
```typescript
if (card.lapses >= 5 && !card.suspended) {
  card.suspended = true
}
```

**문제점:**
- **lapses >= 5**: 일본어 학습에서는 너무 엄격
- 복잡한 한자나 어려운 단어는 7-10회 실패가 정상
- suspended 후 복구 메커니즘 없음

**개선 제안:**
```typescript
// 일본어 학습에 맞춘 Leech 기준
const LEECH_THRESHOLD = 8  // 8회 실패 시 Leech

if (card.lapses >= LEECH_THRESHOLD && !card.suspended) {
  card.suspended = true
  // 추가: Leech 카드도 주기적으로 복습 기회 제공
}

// Leech 복구 메커니즘 추가
// suspended 카드도 30일마다 한 번씩 복습 기회 제공
```

---

## ⚠️ 중간 문제점 (Moderate Issues)

### 5. 'good' 평가 시 ease 조정 없음

**현재 구현:**
```typescript
if (params.grade === 'hard') {
  card.ease = Math.max(MIN_EASE, card.ease - 0.15)
} else if (params.grade === 'easy') {
  card.ease = card.ease + 0.15
}
// 'good'은 ease 조정 없음
```

**문제점:**
- 'good'이 가장 많이 사용되는 평가인데 ease 조정 없음
- 학습 곡선이 평평해짐
- 개인화된 학습 어려움

**개선 제안:**
```typescript
// 'good'도 미세하게 ease 증가 (학습 향상 반영)
if (params.grade === 'hard') {
  card.ease = Math.max(MIN_EASE, card.ease - 0.15)
} else if (params.grade === 'good') {
  // 미세한 증가 (0.05)로 학습 향상 반영
  card.ease = Math.min(3.0, card.ease + 0.05)
} else if (params.grade === 'easy') {
  card.ease = Math.min(3.0, card.ease + 0.15)
}
```

---

### 6. 복습 큐 생성 로직의 문제

**현재 구현:**
```typescript
// 복습 선택 (due 오름차순으로 TARGET까지)
const selectedReview = reviewCards.slice(0, TARGET)
const remainingSlots = Math.max(TARGET - selectedReview.length, 0)
const selectedNew = newCards.slice(0, remainingSlots)
```

**문제점:**
- 복습 카드가 많으면 새 카드가 전혀 나오지 않음
- 학습자 동기 저하 (새로운 콘텐츠 없음)
- 복습/새 카드 비율 고정 필요

**개선 제안:**
```typescript
// 복습:새 카드 비율 유지 (예: 70:30)
const REVIEW_RATIO = 0.7
const NEW_RATIO = 0.3

const reviewLimit = Math.floor(TARGET * REVIEW_RATIO)
const newLimit = Math.floor(TARGET * NEW_RATIO)

const selectedReview = reviewCards.slice(0, reviewLimit)
const selectedNew = newCards.slice(0, newLimit)
```

---

### 7. Lapse 처리 시 간격 감소가 과도함

**현재 구현:**
```typescript
if (params.grade === 'again') {
  card.lapses += 1
  if (isLearningPhase) {
    card.interval = firstStep  // 1분으로 초기화
  } else {
    card.interval = secondStep  // 10분으로 재진입
    card.ease = Math.max(MIN_EASE, card.ease - 0.2)
  }
}
```

**문제점:**
- 복습 단계에서 오답 시 10분으로 재진입 → 너무 짧음
- 이미 학습한 카드를 처음부터 다시 시작하는 것은 비효율적

**개선 제안:**
```typescript
if (params.grade === 'again') {
  card.lapses += 1
  if (isLearningPhase) {
    // 학습 단계: 첫 스텝으로 초기화
    card.interval = LEARNING_STEPS[0]  // 4시간
  } else {
    // 복습 단계: 현재 간격의 25%로 감소 (너무 짧지 않게)
    card.interval = Math.max(
      LEARNING_STEPS[1],  // 최소 1일
      Math.floor(card.interval * 0.25)
    )
    card.ease = Math.max(MIN_EASE, card.ease - 0.2)
  }
}
```

---

## 💡 개선 제안 (Enhancement Suggestions)

### 8. 개인화된 학습 곡선

**제안:**
- 사용자별 학습 패턴 분석
- 어려운 카드 자동 감지 및 간격 조정
- 레벨별 최적 간격 설정

```typescript
// 레벨별 최적 간격
const LEVEL_INTERVALS = {
  'N5': { first: 2, second: 4, ease: 2.5 },
  'N4': { first: 2, second: 5, ease: 2.4 },
  'N3': { first: 3, second: 6, ease: 2.3 },
  'N2': { first: 3, second: 7, ease: 2.2 },
  'N1': { first: 4, second: 8, ease: 2.1 },
}
```

---

### 9. 망각 곡선 고려

**제안:**
- Ebbinghaus 망각 곡선 반영
- 복습 타이밍 최적화

```typescript
// 망각 곡선 기반 간격
const FORGETTING_CURVE_INTERVALS = [
  4 * 60,      // 4시간 (첫 복습)
  24 * 60,     // 1일 (50% 망각 시점)
  3 * 24 * 60, // 3일 (70% 망각 시점)
  7 * 24 * 60, // 7일 (80% 망각 시점)
  14 * 24 * 60, // 14일 (90% 망각 시점)
  30 * 24 * 60, // 30일 (장기 기억)
]
```

---

### 10. Leech 복구 메커니즘

**제안:**
- Leech 카드도 주기적으로 복습 기회 제공
- 다른 학습 방법 제안 (예: 예문 중심 학습)

```typescript
// Leech 카드도 30일마다 한 번씩 복습 기회
if (card.suspended && daysSinceLastReview >= 30) {
  // Leech 복구 시도
  card.suspended = false
  card.interval = LEARNING_STEPS[0]  // 처음부터 다시
}
```

---

## 📊 비교 분석

### 현재 vs 개선안

| 항목 | 현재 | 개선안 | 이유 |
|------|------|--------|------|
| 첫 학습 스텝 | 1분 | 4시간 | 단기→장기 기억 전환 |
| 첫 복습 간격 | 1일 | 2-3일 | 망각 곡선 고려 |
| 장기 기억 기준 | 21일 | 30일 | 실제 장기 기억 기준 |
| Mastered reps | 8회 | 12회 | 충분한 반복 학습 |
| Leech 기준 | 5회 | 8회 | 일본어 학습 특성 |
| Lapse 재진입 | 10분 | 현재 간격의 25% | 비효율적 재학습 방지 |

---

## 🎯 핵심 개선 사항 요약

1. **학습 스텝**: 1분 → 4시간으로 변경
2. **첫 복습**: 1일 → 2-3일로 변경
3. **장기 기억**: 21일 → 30일로 변경
4. **Mastered reps**: 8회 → 12회로 변경
5. **Leech 기준**: 5회 → 8회로 변경
6. **복습/새 카드 비율**: 고정 비율 유지 (70:30)
7. **'good' 평가**: ease 미세 증가 (0.05)
8. **Lapse 처리**: 현재 간격의 25%로 감소 (최소 1일)

---

## 📚 참고 이론

1. **Ebbinghaus 망각 곡선**: 24시간 후 50%, 48시간 후 70% 망각
2. **단기 기억 → 장기 기억 전환**: 최소 4-6시간 필요
3. **Spaced Repetition 최적 간격**: 1일 → 3일 → 7일 → 14일 → 30일
4. **언어 학습 반복 횟수**: 최소 10-15회 필요
5. **Anki 기본 설정**: 학습 스텝 1분 → 10분 → 1일 (언어 학습에는 부적합)

---

## ✅ 결론

현재 알고리즘은 기본적인 SRS 구조는 갖추고 있지만, **언어 학습에 특화된 최적화가 부족**합니다. 특히:

1. 학습 스텝이 너무 짧아 실제 학습 효과가 낮음
2. 장기 기억 판정이 너무 이르게 이루어짐
3. 복습 큐 생성 시 새 카드 비율 보장 필요
4. Leech 처리 후 복구 메커니즘 부재

위 개선 사항들을 적용하면 **실제 언어 학습 효과가 크게 향상**될 것입니다.
