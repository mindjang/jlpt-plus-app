# Firestore 컬렉션 구조 및 운영 가이드

## 📊 데이터베이스 구조 개요

```
/users/{uid}
  ├── (profile fields - direct document)
  ├── /cards/{cardId}              - SRS 학습 카드 상태
  ├── /membership/{doc}            - 멤버십 정보 (읽기 전용)
  ├── /usage/{dateKey}             - 일일 무료 세션 사용량
  ├── /billing/{doc}               - 🔒 결제 정보 (서버 전용)
  ├── /stats/{doc}                 - 학습 통계
  ├── /dailyActivity/{dateKey}     - 일별 활동 기록
  ├── /quiz/{doc}                  - 퀴즈 데이터
  └── /quizSessions/{sessionId}    - 퀴즈 세션 기록

/codes/{code}                       - 기프트 코드 (읽기 전용)
/admin/{document}                   - 🔒 관리자 데이터 (서버 전용)
```

## 🔐 컬렉션별 상세 설명

### 1. `/users/{uid}` - 사용자 프로필

**접근 권한:** 본인 read/write

**필드 예시:**
```typescript
{
  profile: {
    displayName: string
    phoneNumber?: string
    targetLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  }
  settings: {
    dailyNewLimit: number
    // ...
  }
}
```

**운영 노트:**
- 사용자 기본 정보 저장
- 민감 정보는 여기에 저장하지 않음 (billing 컬렉션 사용)

---

### 2. `/users/{uid}/cards/{cardId}` - SRS 카드 상태

**접근 권한:** 본인 read/write

**문서 ID 형식:**
- 단어: `{entry_id}` (예: "あいさつ")
- 한자: `{level}_K_{index}` (예: "N5_K_0001")

**필드:**
```typescript
{
  itemId: string        // 콘텐츠 고유 ID
  type: 'word' | 'kanji'
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
  reps: number          // 복습 횟수
  lapses: number        // 틀린 횟수
  interval: number      // 복습 간격 (일)
  ease: number          // 난이도 계수
  due: number           // 다음 복습일 (일 단위)
  lastReviewed: number  // 마지막 복습일 (일 단위)
  suspended?: boolean   // leech 처리
}
```

**운영 노트:**
- Anki 스타일 SRS 알고리즘 사용
- 콘텐츠 데이터는 포함하지 않음 (코드 내 .ts 파일로 관리)
- 대량 업데이트는 배치 처리 권장

---

### 3. `/users/{uid}/membership/{doc}` - 멤버십 정보

**접근 권한:** 본인 read, 서버만 write

**문서 ID:** `info` (고정)

**필드:**
```typescript
{
  type: 'gift' | 'monthly' | 'yearly'
  source: 'code' | 'subscription'
  expiresAt: number     // 만료 시각 (ms)
  createdAt: number
  updatedAt: number
  lastRedeemedCode?: string
}
```

**운영 노트:**
- 클라이언트는 읽기만 가능 (UI 표시용)
- 변경은 서버 API를 통해서만 (Admin SDK)
- 만료 체크는 `expiresAt <= Date.now()`

---

### 4. `/users/{uid}/usage/{dateKey}` - 일일 사용량

**접근 권한:** 본인 read, 서버만 write

**문서 ID:** `YYYYMMDD` 형식 (예: "20251214")

**필드:**
```typescript
{
  dateKey: string       // "YYYYMMDD"
  sessionsUsed: number  // 해당 날짜 사용한 세션 수
  updatedAt: number
}
```

**운영 노트:**
- 비회원/만료 회원: 하루 1회 무료 세션 제한
- 회원: 무제한 (이 컬렉션 참조하지 않음)
- 자정마다 자동 초기화 (새 dateKey로 관리)

---

### 5. 🔒 `/users/{uid}/billing/{doc}` - 결제 정보 (서버 전용)

**접근 권한:** 서버만 read/write (클라이언트 완전 차단)

**문서 ID:** `info` (고정)

**필드:**
```typescript
{
  billingKey: string      // 🔐 PortOne 빌링키 (정기결제용)
  plan: 'monthly' | 'yearly'
  lastPaymentId: string
  lastPaidAt: number
  amount: number
  provider: 'portone'
}
```

**⚠️ 보안 중요 사항:**
- **billingKey는 절대 클라이언트로 노출되면 안 됨**
- Firestore Rules에서 클라이언트 read/write 완전 차단
- 서버 API에서만 Admin SDK로 접근
- 로그에도 출력 금지 (마스킹 처리)

**운영 노트:**
- 결제 수단 변경: 새 billingKey로 덮어쓰기
- 구독 해지: `membership` expiresAt을 과거로 설정 (billing은 유지)

---

### 6. `/users/{uid}/stats/{doc}` - 학습 통계

**접근 권한:** 본인 read/write

**문서 ID 예시:**
- 레벨별: `N5`, `N4`, `N3`, `N2`, `N1`
- 집계: `summary`

**필드 (레벨별):**
```typescript
{
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  totalCards: number
  newCards: number
  learningCards: number
  reviewCards: number
  longTermMemory: number
  suspended: number
  updatedAt: number
}
```

**운영 노트:**
- 카드 상태 변경 시 증분 업데이트 권장
- 불일치 시 `recalculateLevelStats()` 호출

---

### 7. `/users/{uid}/dailyActivity/{dateKey}` - 일별 활동

**접근 권한:** 본인 read/write

**문서 ID:** `YYYYMMDD` 형식

**필드:**
```typescript
{
  dateKey: string       // "YYYYMMDD"
  studyMinutes: number
  cardsReviewed: number
  newCardsLearned: number
  quizzesTaken: number
  accuracy: number      // 0-1
  streakDays: number
  updatedAt: number
}
```

**운영 노트:**
- 연속 일수 (streak) 계산에 사용
- 캘린더 히트맵 표시용

---

### 8. `/users/{uid}/quiz/{doc}` - 퀴즈 데이터

**접근 권한:** 본인 read/write

**문서 ID 예시:**
- 레벨별 통계: `level-N5`, `level-N4`, etc.
- 사용자 레벨: `userLevel`

**필드 (레벨별 통계):**
```typescript
{
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  totalQuestions: number
  correctAnswers: number
  averageAccuracy: number
  totalSessions: number
  itemStats: {
    [itemId: string]: {
      correct: number
      total: number
      lastAttempt: number
    }
  }
}
```

**운영 노트:**
- 약점 분석에 활용
- itemStats는 주기적 클린업 권장 (오래된 데이터 제거)

---

### 9. `/users/{uid}/quizSessions/{sessionId}` - 퀴즈 세션

**접근 권한:** 본인 read/write

**문서 ID:** `{uid}-{timestamp}` 형식

**필드:**
```typescript
{
  sessionId: string
  uid: string
  startTime: number
  endTime?: number
  settings: QuizSettings
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  score: number
  expGained: number
  maxStreak: number
}
```

**운영 노트:**
- 퀴즈 히스토리 조회용
- 오래된 세션 (90일+) 주기적 아카이빙 고려

---

### 10. `/codes/{code}` - 기프트 코드

**접근 권한:** 인증된 사용자 read, 서버만 write

**문서 ID:** 정규화된 코드 (대문자, 하이픈 제거)

**필드:**
```typescript
{
  type: 'gift' | 'monthly' | 'yearly'
  durationDays: number
  remainingUses?: number  // null이면 무제한
  createdAt: number
}
```

**운영 노트:**
- 클라이언트는 읽기 가능 (중복 등록 확인용)
- 등록/차감은 서버만
- 사용 완료된 코드도 삭제하지 않음 (감사 로그)

---

### 11. 🔒 `/admin/{document}` - 관리자 데이터

**접근 권한:** 서버만 (클라이언트 완전 차단)

**운영 노트:**
- 관리 콘솔 백엔드 데이터
- 통계 집계, 사용자 목록 등

---

## 🛡️ 보안 체크리스트

### 배포 전 확인 사항

- [ ] Firestore Rules가 프로덕션에 배포되었는가?
- [ ] `/users/{uid}/billing` 클라이언트 접근 차단 확인
- [ ] `/admin` 컬렉션 클라이언트 접근 차단 확인
- [ ] Firebase Console Rules Playground 테스트 완료
- [ ] 서버 API 인증 미들웨어 적용 확인
- [ ] billingKey 로그 출력 여부 확인 (마스킹 필요)

### 정기 점검 (월 1회)

- [ ] 사용하지 않는 오래된 세션 데이터 정리
- [ ] itemStats 크기 모니터링 (큰 문서는 분할)
- [ ] Rules 위반 로그 확인 (Firebase Console)
- [ ] 비정상 usage 패턴 탐지 (무료 세션 악용)

---

## 📖 관련 문서

- [FIRESTORE_RULES.md](../FIRESTORE_RULES.md) - Rules 배포 가이드
- [FIREBASE_SETUP.md](../FIREBASE_SETUP.md) - 초기 설정
- [IMPROVEMENTS.md](../IMPROVEMENTS.md) - 코드 개선 히스토리
