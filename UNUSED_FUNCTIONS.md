# 사용되지 않는 함수 목록

프로젝트에서 export되었지만 실제로 사용되지 않는 함수들의 목록입니다.

## 🔴 완전히 사용되지 않는 함수

### 1. `lib/utils/requestDeduplication.ts`
- `cleanupRequestCache()` - 캐시 정리 함수 (사용처 없음)
- `cancelAllPendingRequests()` - 모든 대기 중인 요청 취소 (사용처 없음)
- `cancelRequest()` - 특정 요청 취소 (사용처 없음)

**제거 가능 여부**: ✅ 제거 가능 (향후 필요 시 추가 가능)

---

### 2. `lib/stats/storage.ts`
- `exportStats()` - 통계 내보내기 (백업용, 사용처 없음)
- `importStats(data: string)` - 통계 가져오기 (백업 복원용, 사용처 없음)

**제거 가능 여부**: ⚠️ 백업 기능으로 유지 고려 (UI 미구현)

---

### 3. `lib/constants/colors.ts`
- `getLevelGradientCSS(level: string)` - CSS 그라데이션 문자열 반환 (사용처 없음)

**제거 가능 여부**: ✅ 제거 가능 (다른 함수로 대체됨)

---

### 4. `lib/quiz/expSystem.ts`
- `calculateSessionExp(...)` - 세션 총 경험치 계산 (사용처 없음)

**제거 가능 여부**: ✅ 제거 가능 (현재는 개별 문제별로 경험치 계산)

---

### 5. `lib/stats/calculator.ts`
- `checkRecordBreak(result: GameResult)` - 기록 갱신 확인 (사용처 없음)
- `calculateSummary(stats: UserStats)` - 통계 요약 계산 (사용처 없음)

**제거 가능 여부**: ⚠️ 향후 기능으로 유지 고려 (UI 미구현)

---

### 6. `lib/quiz/statsTracker.ts`
- `analyzeLevelPerformance(...)` - 레벨별 정답률 분석 (사용처 없음)

**제거 가능 여부**: ✅ 제거 가능 (다른 함수로 대체됨)

---

## ⚠️ Deprecated 함수 (사용 중이지만 마이그레이션 권장)

### 1. `data/words/index.ts`
- `getNaverWordsByLevel(level)` - 동기 함수 (deprecated)
  - **사용처**: 7곳
  - **대체 함수**: `getNaverWordsByLevelAsync()`
  - **마이그레이션 필요**: ✅

### 2. `data/kanji/index.ts`
- `getKanjiByLevel(level)` - 동기 함수 (deprecated)
  - **사용처**: 6곳
  - **대체 함수**: `getKanjiByLevelAsync()`
  - **마이그레이션 필요**: ✅

---

## 📊 요약

### 즉시 제거 가능 (6개)
1. `cleanupRequestCache()`
2. `cancelAllPendingRequests()`
3. `cancelRequest()`
4. `getLevelGradientCSS()`
5. `calculateSessionExp()`
6. `analyzeLevelPerformance()`

### 백업/향후 기능으로 유지 고려 (4개)
1. `exportStats()` - 백업 기능
2. `importStats()` - 백업 기능
3. `checkRecordBreak()` - 기록 기능
4. `calculateSummary()` - 통계 요약 기능

### Deprecated 마이그레이션 필요 (2개)
1. `getNaverWordsByLevel()` → `getNaverWordsByLevelAsync()`
2. `getKanjiByLevel()` → `getKanjiByLevelAsync()`

---

## 제거 시 주의사항

1. **테스트 코드 확인**: 제거 전 테스트 코드에서 사용하는지 확인
2. **타입 정의**: 제거 시 관련 타입도 확인 필요
3. **의존성**: 다른 함수가 내부적으로 사용하는지 확인

