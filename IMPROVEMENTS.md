# 코드베이스 개선 완료 보고서 - Mogu-JLPT

**프로젝트**: Mogu-JLPT (MoguMogu 언어 학습 플랫폼 - JLPT 시험 대비)

## 개선 날짜
2025-12-11

## 완료된 개선사항

### ✅ 1. API 키 하드코딩 제거 (보안)

**문제점:**
- RapidAPI 키가 여러 scripts 파일에 하드코딩되어 있었음
- GitHub에 푸시 시 키가 공개되는 보안 위험

**해결:**
- 모든 scripts 파일에서 fallback API 키 제거
- 환경변수가 없으면 명확한 에러 메시지 출력
- `env.example`에 `RAPIDAPI_KEY` 추가

**변경된 파일:**
- `scripts/retry-failed-n1-kanji.ts`
- `scripts/fetch-n1-kanji-data.ts`
- `scripts/fetch-n2-kanji-data.ts`
- `scripts/fetch-n3-kanji-data.ts`
- `scripts/fetch-n4-kanji-data.ts`
- `scripts/shared/fetchKanjiHelpers.ts`
- `env.example`

---

### ✅ 2. API 라우트 인증 추가 (보안)

**문제점:**
- API 라우트가 클라이언트에서 `customerId`를 받아 그대로 사용
- 악의적 사용자가 다른 사용자의 ID로 요청 가능

**해결:**
- Firebase Admin SDK 설치 (`firebase-admin`)
- 서버 사이드 인증 미들웨어 생성
- Authorization 헤더에서 Firebase ID 토큰 검증
- 검증된 사용자의 `uid`를 `customerId`로 사용

**새로 생성된 파일:**
- `lib/firebase/admin.ts` - Firebase Admin 초기화
- `lib/firebase/auth-middleware.ts` - 인증 미들웨어

**변경된 파일:**
- `app/api/pay/subscribe/route.ts` - 인증 추가
- `app/api/pay/issue-billing-key/route.ts` - 인증 추가
- `app/api/pay/schedule/route.ts` - 인증 추가
- `hooks/usePayment.ts` - Authorization 헤더 추가, customerId 제거

**환경변수 추가:**
```env
FIREBASE_SERVICE_ACCOUNT=<SERVICE_ACCOUNT_JSON>
FIREBASE_PROJECT_ID=<PROJECT_ID>
```

---

### ✅ 3. Chart.js 제거 (성능)

**문제점:**
- Chart.js는 매우 큰 라이브러리 (~200KB)
- 동적 임포트로도 초기 로딩 속도 저하
- 이미 SVG 대안이 구현되어 있음

**해결:**
- Chart.js 관련 코드 완전 제거
- SVG 버전만 사용하도록 단순화
- `useChart` prop은 레거시 호환성을 위해 유지 (무시됨)

**변경된 파일:**
- `components/ui/SemicircleProgress.tsx` - Chart.js 코드 제거 (~100줄 감소)
- `app/(root)/acquire/auto-study/[level]/page.tsx` - `useChart` prop 제거

**성능 개선:**
- 번들 사이즈 약 200KB 감소
- 불필요한 동적 임포트 제거

---

### ✅ 4. 데이터 페이지네이션 (성능 & 확장성)

**문제점:**
- `getCardsByLevel`, `getAllCardIds` 함수가 모든 카드를 한 번에 가져옴
- 사용자당 수천 개의 카드가 있을 경우 메모리 및 속도 문제

**해결:**
- 모든 Firestore 쿼리에 `limit` 추가
- 기본 limit: 500~1000개 (조정 가능)
- `getCardIdsByLevel` 함수 추가 (레벨별 ID만 조회)
- `getCardsCountByLevel` 함수 추가 (개수만 조회)

**변경된 파일:**
- `lib/firebase/firestore.ts` - 페이지네이션 지원 추가

**API 변경:**
```typescript
// Before
getCardsByLevel(uid, level)
getAllCardIds(uid)

// After
getCardsByLevel(uid, level, limitCount = 500)
getAllCardIds(uid, limitCount = 1000)
getCardIdsByLevel(uid, level, limitCount = 500) // NEW
getCardsCountByLevel(uid, level) // NEW
```

---

### ✅ 5. Firestore 집계 데이터 구조 (성능)

**문제점:**
- 진행률 계산 시 매번 모든 카드를 읽어와 집계
- 사용자가 많아질수록 읽기 비용 증가

**해결:**
- 레벨별 통계를 별도 문서로 관리
- 경로: `/users/{uid}/stats/{level}`
- 통계 내용: 총 카드 수, 새 카드, 학습 중, 복습 대기, 장기 기억

**새로 생성된 파일:**
- `lib/types/stats.ts` - 통계 타입 정의

**변경된 파일:**
- `lib/firebase/firestore.ts` - 통계 관리 함수 추가

**새로운 함수:**
```typescript
getLevelStats(uid, level) // 통계 조회
initializeLevelStats(uid, level) // 통계 초기화
updateLevelStats(uid, level, cardType, updates) // 통계 업데이트
recalculateLevelStats(uid, level) // 통계 재계산
```

**사용 시나리오:**
1. 카드 학습 시 `updateLevelStats`로 통계 증감
2. 진행률 표시 시 `getLevelStats`로 통계만 조회 (카드 조회 불필요)
3. 데이터 불일치 시 `recalculateLevelStats`로 재계산

---

---

### ✅ 6. 에러 경계 추가 (UX 개선)

**문제점:**
- 컴포넌트 에러 발생 시 전체 앱 크래시
- 사용자에게 친화적인 에러 메시지 부재

**해결:**
- React Error Boundary 컴포넌트 생성
- 전역 Provider에 적용
- 개발/프로덕션 환경별 에러 표시
- 섹션별 에러 경계 지원

**새로 생성된 파일:**
- `components/ErrorBoundary.tsx` - Error Boundary 컴포넌트
- `components/Providers.tsx` - 전역 Provider 통합

**변경된 파일:**
- `app/layout.tsx` - Providers로 통합
- `app/(root)/layout.tsx` - ErrorBoundary 추가

**기능:**
- 에러 발생 시 친화적인 UI 표시
- "다시 시도" 및 "홈으로" 버튼
- 개발 모드에서 상세 에러 정보 표시

---

### ✅ 7. 거대 컴포넌트 분리 (가독성 & 유지보수성)

**문제점:**
- `auto-study/[level]/page.tsx`가 436줄로 과도하게 큼
- 여러 책임이 하나의 파일에 혼재
- 재사용 불가능

**해결:**
- 4개의 독립적인 컴포넌트로 분리
- 각 컴포넌트가 단일 책임만 담당
- Props를 통한 명확한 인터페이스

**새로 생성된 컴포넌트:**
- `components/study/AutoStudyCard.tsx` - 자동 학습 메인 카드 (147줄)
- `components/study/StudyInfoCard.tsx` - 학습 정보 카드 (62줄)
- `components/study/ChapterListSection.tsx` - 챕터 목록 (110줄)
- `components/study/StudyTabNavigation.tsx` - 하단 탭 네비게이션 (48줄)

**변경된 파일:**
- `app/(root)/acquire/auto-study/[level]/page.tsx` - 252줄로 감소 (42% 감소)

**장점:**
- 테스트 작성 용이
- 컴포넌트 재사용 가능
- 코드 가독성 향상
- 버그 수정 범위 명확

---

### ✅ 8. 중복 코드 제거 (유지보수성)

**문제점:**
- `usePayment.ts`의 `handleSubscribe`와 `handleSubscribeKakao`가 거의 동일 (~200줄 중복)
- 버그 수정 시 두 곳 모두 수정 필요

**해결:**
- 공통 로직을 `processSubscription` 함수로 추출
- 결제 방법별 설정을 `BillingKeyConfig` 인터페이스로 정의
- 두 핸들러가 공통 함수를 재사용

**변경된 파일:**
- `hooks/usePayment.ts` - 256줄 → 156줄 (약 100줄 감소, 39% 감소)

**개선사항:**
```typescript
// Before: 각각 ~100줄의 중복 코드
handleSubscribe()     // 카드 결제
handleSubscribeKakao() // 카카오페이

// After: 공통 로직 + 설정
processSubscription(plan, config, setLoading) // 공통
  ↑ handleSubscribe()     - config로 카드 설정 전달
  ↑ handleSubscribeKakao() - config로 카카오 설정 전달
```

**장점:**
- 버그 수정 시 한 곳만 수정
- 새로운 결제 방법 추가 용이
- 코드 가독성 향상
- 테스트 범위 감소

---

### ✅ 9. 매직 넘버 상수화 (가독성 & 유지보수성)

**문제점:**
- 코드 곳곳에 의미를 알 수 없는 숫자들이 하드코딩됨
- 값을 변경하려면 여러 파일을 수정해야 함
- 같은 숫자가 다른 의미로 사용될 가능성

**해결:**
- 중앙 집중식 상수 파일 생성
- 모든 매직 넘버를 의미있는 이름의 상수로 교체
- 상수마다 상세한 주석 추가

**새로 생성된 파일:**
- `lib/srs/constants.ts` - SRS 알고리즘 상수 (195줄)
- `lib/constants/ui.ts` - UI 관련 상수

**변경된 파일:**
- `lib/srs/reviewCard.ts` - 모든 매직 넘버를 상수로 교체
- `lib/srs/studyQueue.ts` - 학습 큐 설정값 상수화
- `lib/srs/progressCalculation.ts` - 장기 기억 판정 기준 상수화
- `lib/firebase/firestore.ts` - 통계 계산 기준 상수화
- `components/study/AutoStudyCard.tsx` - 목표 학습량 옵션 상수화
- `components/study/ChapterListSection.tsx` - 목표 학습량 옵션 상수화

**상수화된 매직 넘버:**

| 항목 | Before | After | 의미 |
|------|--------|-------|------|
| Ease Factor | `2.5`, `1.3`, `3.0` | `DEFAULT_EASE`, `MIN_EASE`, `MAX_EASE` | 난이도 계수 |
| Ease 조정 | `0.2`, `0.15`, `0.05` | `EASE_AGAIN_PENALTY`, `EASE_HARD_PENALTY`, etc. | 평가별 난이도 조정값 |
| 학습 단계 | `4*60`, `24*60`, `3*24*60` | `LEARNING_STEP_1/2/3_MINUTES` | 4시간→1일→3일 |
| 복습 간격 | `2`, `3`, `5`, `7` | `FIRST/SECOND/THIRD_REVIEW_X_DAYS` | 초기 복습 간격 |
| Lapse 처리 | `0.25` | `LAPSE_REDUCTION_FACTOR` | 오답 시 간격 감소율 25% |
| Leech 기준 | `8` (틀린 횟수) | `LEECH_THRESHOLD` | Leech 판정 기준 |
| 장기 기억 | `21`, `8` | `LONG_TERM_MEMORY_INTERVAL_DAYS`, `LONG_TERM_MEMORY_REPS` | 21일 또는 8회 |
| 학습 큐 | `10`, `100`, `0.7`, `0.3` | `DEFAULT_DAILY_NEW_CARDS`, `MAX_REVIEW_CARDS_FETCH`, etc. | 학습 큐 설정 |
| UI 옵션 | `[5,10,15...]`, `[10,20,30,50]` | `AUTO_STUDY_TARGET_OPTIONS`, `CHAPTER_STUDY_TARGET_OPTIONS` | 목표량 선택지 |

**개선 효과:**

```typescript
// Before: 이게 뭐지? 🤔
if (card.lapses >= 8) { 
  card.suspended = true 
}
const reducedInterval = Math.floor(card.interval * 0.25)

// After: 아하! 명확하다 ✨
if (card.lapses >= LEECH_THRESHOLD) {  // Leech 판정 기준
  card.suspended = true 
}
const reducedInterval = Math.floor(card.interval * LAPSE_REDUCTION_FACTOR)  // 오답 시 25% 감소
```

**장점:**
- 코드 가독성 대폭 향상
- 값 변경 시 한 곳만 수정
- 알고리즘 이해 용이 (주석 포함)
- 실수 방지 (의미 명확)
- 테스트 작성 용이

---

## 추가 권장사항 (향후 작업)

### 중간 우선순위
1. **전역 상태 관리** - Zustand 도입으로 단어/한자 데이터 캐싱
2. **타입 검증 강화** - Zod로 Firestore 데이터 런타임 검증

### 낮은 우선순위
1. **단위 테스트** - SRS 알고리즘 테스트
2. **이미지 최적화** - WebP 포맷 사용
3. **매직 넘버 상수화** - `studyQueue.ts`, `reviewCard.ts`
4. **ESLint/Prettier** - 코드 스타일 통일

---

## 영향 받는 기능

### 테스트 필요
1. **결제 플로우** - 인증이 추가되어 Authorization 헤더 필수
2. **스크립트 실행** - `RAPIDAPI_KEY` 환경변수 필수
3. **진행률 표시** - 통계 문서가 없으면 0으로 표시 (초기화 필요)

### 배포 전 필수 설정
```bash
# .env.local 파일에 추가
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
RAPIDAPI_KEY=your_rapidapi_key_here
```

---

## 성능 개선 예상치

- **번들 사이즈**: ~200KB 감소 (Chart.js 제거)
- **Firestore 읽기**: 진행률 조회 시 1회 읽기로 감소 (기존 수백 개 → 1개)
- **초기 로딩**: 페이지네이션으로 최대 500개로 제한

---

## 보안 개선

- ✅ API 키 노출 위험 제거
- ✅ API 라우트 인증으로 IDOR 취약점 해결
- ✅ 서버 사이드 검증 추가

---

## 참고 문서
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Firestore 페이지네이션: https://firebase.google.com/docs/firestore/query-data/query-cursors
