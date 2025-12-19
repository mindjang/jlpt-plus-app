# 시스템 정책 문서

이 문서는 Mogu-JLPT 플랫폼의 핵심 운영 정책을 정의합니다.

## 목차

1. [구독/권한 모델](#1-구독권한-모델)
2. [데이터 스키마 필드 표준](#2-데이터-스키마-필드-표준)
3. [수집/재집계/캐싱 정책](#3-수집재집계캐싱-정책)
4. [공유 토큰 정책](#4-공유-토큰-정책)
5. [관리자 보안 정책](#5-관리자-보안-정책)

---

## 1. 구독/권한 모델

### 1.1 사용자 상태 분류

사용자는 다음 4가지 상태 중 하나를 가집니다:

| 상태 | 조건 | 설명 |
|------|------|------|
| `guest` | `user === null` | 비로그인 사용자 |
| `nonMember` | `user !== null && membership === null` | 로그인했으나 멤버십 없음 |
| `expired` | `membership.expiresAt <= Date.now()` | 멤버십 만료 |
| `member` | `membership.expiresAt > Date.now()` | 활성 멤버십 보유 |

### 1.2 멤버십 타입

```typescript
type MembershipType = 'monthly' | 'yearly' | 'gift'
type MembershipSource = 'subscription' | 'code' | 'one-time' // 향후 단건결제 추가 예정
```

- **monthly**: 월간 정기결제 (PortOne) - 최대 3개월 운영 가능
- **yearly**: 연간 단건결제 (PortOne) - 향후 단건결제로 제공 예정 (정기구독 아님)
- **gift**: 기프트 코드로 획득한 멤버십

**⚠️ 중요:**
- 정기구독은 **월간(monthly)만 가능** (최대 3개월 운영 제한)
- 연간(yearly)은 향후 단건결제(1회성)로 제공 예정

### 1.3 기능별 접근 권한

#### 학습 세션 제한

| 사용자 상태 | 일일 세션 제한 | 무료 세션 |
|------------|---------------|----------|
| `guest` | 0 | 없음 |
| `nonMember` | 1 | 하루 1회 |
| `expired` | 1 | 하루 1회 |
| `member` | 무제한 | 무제한 |

**구현 위치:**
- `components/membership/MembershipProvider.tsx`
- `lib/firebase/firestore/membership.ts`

#### 데이터 접근 권한

| 컬렉션 | guest | nonMember | expired | member |
|--------|-------|-----------|---------|--------|
| 프로필 읽기 | ❌ | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 |
| 학습 카드 | ❌ | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 |
| 통계 조회 | ❌ | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 |
| 퀴즈 기록 | ❌ | ✅ 본인만 | ✅ 본인만 | ✅ 본인만 |
| 멤버십 정보 | ❌ | ✅ 읽기만 | ✅ 읽기만 | ✅ 읽기만 |
| 결제 정보 | ❌ | ❌ | ❌ | ❌ (서버만) |

### 1.4 권한 체크 패턴

```typescript
// 1. 로그인 필요 체크
if (!user) {
  return <LoginRequiredScreen />
}

// 2. 멤버십 필요 체크
if (!isMember) {
  return <PaywallOverlay />
}

// 3. 세션 시작 가능 여부
if (!canStartSession) {
  return <SessionLimitReached />
}
```

### 1.5 멤버십 연장 규칙

- **기존 만료일 이후로 연장**: `baseTime = max(current.expiresAt, now)`
- **기프트 코드**: `newExpiry = baseTime + durationDays * 24 * 60 * 60 * 1000`
- **정기결제**: 구독 시작일 기준으로 매월 자동 갱신 (월간만 가능)
- **단건결제**: 결제 시점부터 지정된 기간만큼 연장 (향후 구현)

---

## 2. 데이터 스키마 필드 표준

### 2.1 필드 네이밍 규칙

#### 카멜케이스 (camelCase)
- JavaScript/TypeScript 객체 필드
- 예: `displayName`, `phoneNumber`, `sessionsUsed`

#### 스네이크케이스 (snake_case)
- Firestore 문서 ID, 컬렉션 경로는 카멜케이스 사용
- 예외: 날짜 키는 `YYYYMMDD` 형식 (하이픈 없음)

#### 대문자 상수
- 타입 정의, 열거형 값
- 예: `'N5' | 'N4' | 'N3' | 'N2' | 'N1'`

### 2.2 타임스탬프 필드 표준

| 필드명 | 타입 | 단위 | 설명 | 예시 |
|--------|------|------|------|------|
| `createdAt` | `number` | epoch ms | 생성 시각 | `1702569600000` |
| `updatedAt` | `number` | epoch ms | 마지막 수정 시각 | `1702569600000` |
| `expiresAt` | `number` | epoch ms | 만료 시각 | `1702569600000` |
| `lastReviewed` | `number` | 일 단위 정수 | 마지막 복습일 | `19723` |
| `due` | `number` | 일 단위 정수 | 다음 복습 예정일 | `19725` |
| `startTime` | `number` | epoch ms | 세션 시작 시각 | `1702569600000` |
| `endTime` | `number` | epoch ms | 세션 종료 시각 | `1702569600000` |

**중요:**
- SRS 카드의 날짜 필드(`due`, `lastReviewed`)는 **일 단위 정수** 사용
- `todayAsDayNumber()` 함수로 변환: `Math.floor(Date.now() / (1000 * 60 * 60 * 24))`
- 나머지는 모두 **epoch milliseconds** 사용

### 2.3 날짜 키 형식

| 용도 | 형식 | 예시 | 함수 |
|------|------|------|------|
| 일일 사용량 | `YYYYMMDD` | `"20251214"` | `formatDateKey()` |
| 일별 활동 | `YYYYMMDD` | `"20251214"` | `formatDateKey()` |
| 캐시 키 | `{uid}_daily_{YYYY-MM-DD}` | `"user123_daily_2025-12-14"` | `getTodayKey()` |

### 2.4 필수 필드 vs 선택 필드

#### 필수 필드 표시
- TypeScript 인터페이스에서 `?` 없이 정의
- 예: `itemId: string` (필수), `suspended?: boolean` (선택)

#### 공통 필수 필드
- `createdAt`: 모든 문서에 필수
- `updatedAt`: 수정 가능한 모든 문서에 필수
- `uid`: 사용자별 하위 컬렉션의 모든 문서

### 2.5 문서 ID 규칙

| 컬렉션 | 문서 ID 형식 | 예시 |
|--------|-------------|------|
| `/users/{uid}/cards/{cardId}` | 단어: `{entry_id}`, 한자: `{level}_K_{index}` | `"あいさつ"`, `"N5_K_0001"` |
| `/users/{uid}/membership/{doc}` | 고정: `"info"` | `"info"` |
| `/users/{uid}/usage/{dateKey}` | `YYYYMMDD` | `"20251214"` |
| `/users/{uid}/billing/{doc}` | 고정: `"info"` | `"info"` |
| `/users/{uid}/stats/{doc}` | 레벨 또는 `"summary"` | `"N5"`, `"summary"` |
| `/users/{uid}/dailyActivity/{dateKey}` | `YYYYMMDD` | `"20251214"` |
| `/codes/{code}` | 정규화된 코드 (대문자, 하이픈 제거) | `"GIFT2024"` |

### 2.6 타입 정의 위치

- **공통 타입**: `lib/types/` 디렉토리
  - `membership.ts`: 멤버십 관련
  - `srs.ts`: SRS 카드 관련
  - `stats.ts`: 통계 관련
  - `user.ts`: 사용자 프로필 관련
  - `quiz.ts`: 퀴즈 관련

- **콘텐츠 타입**: `data/types.ts`
  - 단어, 한자 데이터 구조

---

## 3. 수집/재집계/캐싱 정책

### 3.1 데이터 수집 정책

#### 실시간 수집 (이벤트 기반)

| 이벤트 | 수집 데이터 | 저장 위치 | 트리거 |
|--------|------------|----------|--------|
| 카드 복습 | `cards/{cardId}` 업데이트 | Firestore | `reviewCard()` 호출 |
| 세션 시작 | `usage/{dateKey}` 증가 | Firestore | `incrementDailySession()` |
| 퀴즈 완료 | `quizSessions/{sessionId}` 생성 | Firestore | 퀴즈 종료 시 |
| 일일 활동 | `dailyActivity/{dateKey}` 업데이트 | Firestore | 학습 활동 발생 시 |

#### 배치 수집 (주기적)

| 작업 | 주기 | 대상 | 목적 |
|------|------|------|------|
| 통계 재계산 | 수동 또는 불일치 시 | `stats/{level}` | 데이터 정합성 보장 |
| 오래된 세션 아카이빙 | 월 1회 (예정) | `quizSessions` (90일+) | 저장 공간 최적화 |
| itemStats 클린업 | 수동 | `quiz/{doc}.itemStats` | 오래된 데이터 제거 |

### 3.2 통계 재집계 정책

#### 증분 업데이트 (기본)

```typescript
// 카드 상태 변경 시 즉시 증분 업데이트
await updateLevelStats(uid, level, 'word', {
  newDelta: -1,
  learningDelta: +1
})
```

**장점:**
- 실시간 반영
- Firestore 쓰기 비용 최소화
- 사용자 경험 향상

**사용 시기:**
- 카드 복습 시
- 새 카드 학습 시
- 카드 상태 변경 시

#### 전체 재계산 (예외)

```typescript
// 데이터 불일치 발생 시 전체 재계산
await recalculateLevelStats(uid, 'N5')
```

**사용 시기:**
- 마이그레이션 후
- 데이터 불일치 감지 시
- 관리자 수동 요청 시

**주의사항:**
- 대량 데이터 처리로 인한 성능 저하 가능
- 사용자 활동이 적은 시간대에 실행 권장

### 3.3 캐싱 정책

#### 클라이언트 캐싱 (2단계)

**1. 메모리 캐시 (세션 동안 유지)**
- `Map<string, any>` 사용
- 페이지 새로고침 시 초기화
- 가장 빠른 접근 속도

**2. localStorage 캐시 (브라우저 저장)**
- TTL: 기본 24시간
- 키 형식: `stats_{uid}_{type}_{params}`
- 용량 초과 시 오래된 캐시 50% 자동 삭제

#### 캐시 키 규칙

```typescript
// 일일 데이터
getTodayKey(uid) → `${uid}_daily_${YYYY-MM-DD}`

// 연속 일수
getStreakKey(uid) → `${uid}_streak`

// 히트맵 데이터
getHeatmapKey(uid, year) → `${uid}_heatmap_${year}`

// 주간 데이터
getWeekKey(uid, weekStart) → `${uid}_week_${weekStart}`
```

#### 캐시 무효화 전략

| 이벤트 | 무효화 범위 | 함수 |
|--------|-----------|------|
| 통계 업데이트 | 해당 레벨 캐시 | `removeCachedStats(key)` |
| 사용자 로그아웃 | 모든 캐시 | `clearAllStatsCache()` |
| 멤버십 변경 | 일일 사용량 캐시 | `removeCachedStats(getTodayKey(uid))` |

#### 캐시 TTL 설정

| 데이터 타입 | TTL | 이유 |
|------------|-----|------|
| 일일 통계 | 24시간 | 날짜 변경 시 무효화 |
| 주간 통계 | 7일 | 주 단위 집계 |
| 연속 일수 | 1시간 | 자주 변경 가능 |
| 히트맵 | 30일 | 월 단위 집계 |

### 3.4 서버 사이드 캐싱

현재 구현되지 않음. 향후 고려 사항:
- Redis를 통한 통계 집계 캐싱
- CDN을 통한 정적 콘텐츠 캐싱

---

## 4. 공유 토큰 정책

### 4.1 공유 기능 개요

사용자가 학습 통계, 퀴즈 결과 등을 공유할 수 있는 기능 (향후 구현 예정)

### 4.2 토큰 생성 규칙

#### 토큰 형식
```
{prefix}-{randomBase64}-{timestamp}
```

- `prefix`: 공유 타입 (`stats`, `quiz`, `progress`)
- `randomBase64`: 16자리 Base64 랜덤 문자열
- `timestamp`: 생성 시각 (epoch ms, Base36 인코딩)

예시: `stats-aB3dEf9hIjKlMnOp-1a2b3c4d`

#### 토큰 저장 위치
```
/shared/{token}
```

**필드:**
```typescript
{
  token: string
  uid: string
  type: 'stats' | 'quiz' | 'progress'
  data: any // 공유할 데이터 (스냅샷)
  expiresAt: number // 만료 시각 (epoch ms)
  createdAt: number
  viewCount: number // 조회 횟수
  maxViews?: number // 최대 조회 횟수 (선택)
}
```

### 4.3 접근 권한

| 작업 | 권한 | 설명 |
|------|------|------|
| 토큰 생성 | 인증된 사용자 | 본인 데이터만 공유 가능 |
| 토큰 조회 | 공개 (인증 불필요) | 토큰만 있으면 조회 가능 |
| 토큰 삭제 | 생성자 또는 관리자 | 본인이 생성한 토큰만 삭제 |

### 4.4 만료 정책

| 공유 타입 | 기본 만료 기간 | 최대 만료 기간 |
|----------|--------------|--------------|
| `stats` | 30일 | 90일 |
| `quiz` | 7일 | 30일 |
| `progress` | 90일 | 365일 |

### 4.5 보안 고려사항

1. **토큰 예측 불가능성**
   - 충분한 엔트로피 (최소 128비트)
   - 암호학적으로 안전한 랜덤 생성기 사용

2. **데이터 스냅샷**
   - 공유 시점의 데이터만 저장 (실시간 연동 없음)
   - 민감 정보 제외 (uid, 이메일 등)

3. **조회 제한**
   - `maxViews` 설정 가능 (선택)
   - IP 기반 rate limiting 고려

4. **Firestore Rules**
   ```javascript
   match /shared/{token} {
     allow read: if true; // 공개 조회
     allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
     allow delete: if isAuthenticated() && resource.data.uid == request.auth.uid;
   }
   ```

### 4.6 구현 예정 API

```typescript
// 토큰 생성
POST /api/share/create
{
  type: 'stats' | 'quiz' | 'progress',
  data: any,
  expiresIn?: number, // 일 단위
  maxViews?: number
}

// 토큰 조회
GET /api/share/{token}

// 토큰 삭제
DELETE /api/share/{token}
```

---

## 5. 관리자 보안 정책

### 5.1 관리자 인증

#### 클라이언트 사이드

현재 구현: **개발 환경에서는 인증 생략, 프로덕션에서만 인증 필요**

```typescript
// app/api/admin/*/route.ts
if (process.env.NODE_ENV === 'production') {
  await requireAuth(request)
}
```

**개선 필요:**
- Firebase Custom Claims를 통한 관리자 권한 부여
- 관리자 전용 인증 미들웨어 구현

#### 서버 사이드

**Firebase Admin SDK 사용**
- `lib/firebase/admin.ts`에서 초기화
- Service Account 또는 Application Default Credentials 사용
- 환경변수: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`

### 5.2 관리자 권한 체계 (향후 구현)

```typescript
// Firebase Custom Claims 예시
{
  admin: true,
  role: 'super_admin' | 'admin' | 'moderator',
  permissions: ['users.read', 'users.write', 'content.read', 'reports.read']
}
```

| 역할 | 권한 | 설명 |
|------|------|------|
| `super_admin` | 모든 권한 | 시스템 전체 관리 |
| `admin` | 사용자/콘텐츠 관리 | 사용자 조회, 콘텐츠 수정 |
| `moderator` | 신고 처리 | 신고 조회/처리만 |

### 5.3 Firestore 접근 제어

#### 관리자 전용 컬렉션

```javascript
// firestore.rules
match /admin/{document=**} {
  allow read, write: if false; // 클라이언트 완전 차단
}
```

**접근 방법:**
- Firebase Admin SDK만 사용
- API 라우트를 통한 간접 접근

#### 사용자 데이터 접근

관리자는 다음 데이터에 접근 가능 (서버 사이드만):

| 컬렉션 | 읽기 | 쓰기 | 제한 |
|--------|------|------|------|
| `/users/{uid}` | ✅ | ✅ | 프로필 정보만 |
| `/users/{uid}/billing` | ✅ | ✅ | 결제 정보 (마스킹 처리) |
| `/users/{uid}/membership` | ✅ | ✅ | 멤버십 수정 |
| `/users/{uid}/cards` | ✅ | ❌ | 조회만 (수정 금지) |
| `/users/{uid}/stats` | ✅ | ❌ | 조회만 |
| `/codes/{code}` | ✅ | ✅ | 기프트 코드 관리 |
| `/reports/{reportId}` | ✅ | ✅ | 신고 처리 |

### 5.4 API 보안 미들웨어

#### 인증 미들웨어

```typescript
// lib/firebase/auth-middleware.ts
export async function requireAuth(request: NextRequest)
export async function verifyAuth(request: NextRequest)
```

**사용 예시:**
```typescript
export async function GET(request: NextRequest) {
  const [user, error] = await requireAuth(request)
  if (error) return error
  
  // 인증된 사용자만 접근 가능
}
```

#### 관리자 전용 미들웨어 (향후 구현)

```typescript
export async function requireAdmin(request: NextRequest) {
  const [user, error] = await requireAuth(request)
  if (error) return error
  
  // Custom Claims 확인
  const token = await adminAuth.getUser(user.uid)
  if (!token.customClaims?.admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  return [user, null]
}
```

### 5.5 민감 정보 처리

#### 로깅 정책

| 데이터 타입 | 로깅 | 마스킹 |
|------------|------|--------|
| `billingKey` | ❌ | ✅ (전체 마스킹) |
| `email` | ✅ | ❌ |
| `phoneNumber` | ✅ | ✅ (중간 4자리 마스킹) |
| `uid` | ✅ | ❌ |
| `paymentId` | ✅ | ✅ (일부 마스킹) |

**마스킹 예시:**
```typescript
function maskBillingKey(key: string): string {
  return key.length > 8 
    ? `${key.slice(0, 4)}****${key.slice(-4)}`
    : '****'
}
```

### 5.6 감사 로그 (향후 구현)

관리자 작업은 모두 기록되어야 함:

```typescript
// /admin/audit/{auditId}
{
  adminUid: string
  action: 'user.update' | 'code.create' | 'report.resolve'
  targetId: string
  changes: any
  timestamp: number
  ipAddress?: string
}
```

### 5.7 보안 체크리스트

#### 배포 전 확인

- [ ] Firestore Rules가 프로덕션에 배포되었는가?
- [ ] `/admin` 컬렉션 클라이언트 접근 차단 확인
- [ ] `/users/{uid}/billing` 클라이언트 접근 차단 확인
- [ ] 관리자 API 인증 미들웨어 적용 확인
- [ ] `billingKey` 로그 출력 여부 확인 (마스킹 필요)
- [ ] 환경변수 보안 확인 (`.env` 파일 git 제외)
- [ ] Service Account 키 보안 저장 확인

#### 정기 점검

- [ ] 관리자 권한 목록 정기 검토 (분기별)
- [ ] 사용하지 않는 관리자 계정 비활성화
- [ ] API 접근 로그 모니터링
- [ ] 비정상 접근 패턴 감지

---

## 부록

### 관련 문서

- [Firestore 컬렉션 구조](./FIRESTORE_COLLECTIONS.md)
- [Firestore 보안 규칙](./../FIRESTORE_RULES.md)
- [Firebase 설정 가이드](./../FIREBASE_SETUP.md)

### 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-14 | 1.0 | 초기 문서 작성 |
