# Mogu-JLPT 프로젝트 문서

**Mogu-JLPT**는 JLPT 시험 대비를 위한 간격 반복 학습(SRS) 앱입니다.

## 빠른 시작

### 설치 및 실행
```bash
npm install
npm run dev  # 개발 서버: http://localhost:3000
npm run build  # 프로덕션 빌드
npm test  # 테스트 실행
```

### Firebase 설정
1. `.env.local` 파일 생성:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. Firebase Console에서:
   - Authentication 활성화 (이메일/비밀번호, Google)
   - Firestore Database 생성
   - 보안 규칙 배포 (`FIRESTORE_RULES.md` 참고)

### 테스트 계정
- 이메일: `test@jlpt-plus.app`
- 비밀번호: `test123456`
- ⚠️ 개발/테스트 전용입니다. 프로덕션 환경에서는 사용하지 마세요.

---

## 프로젝트 구조

```
jlpt-plus-app/
├── app/                    # Next.js App Router
│   ├── (root)/            # 사용자 페이지
│   │   ├── home/          # 홈
│   │   ├── acquire/       # 학습 (단어/한자)
│   │   ├── quiz/          # 퀴즈
│   │   ├── game/          # 게임
│   │   ├── stats/         # 통계
│   │   └── my/            # 마이페이지
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── auth/             # 인증
│   ├── study/            # 학습
│   ├── quiz/             # 퀴즈
│   ├── permissions/      # 권한 관리
│   └── ui/               # UI 컴포넌트
├── lib/                  # 비즈니스 로직
│   ├── firebase/         # Firebase 설정/유틸
│   ├── srs/              # SRS 알고리즘
│   ├── permissions/      # 권한 시스템
│   ├── quiz/             # 퀴즈 시스템
│   └── types/            # 타입 정의
├── hooks/                # 커스텀 Hooks
├── data/                 # 정적 데이터 (단어/한자)
└── docs/                 # 문서
```

---

## 핵심 시스템

### 1. 구독/권한 모델

**사용자 상태:**
- `guest`: 비로그인
- `nonMember`: 로그인했으나 멤버십 없음 (일일 1회 무료 세션)
- `expired`: 멤버십 만료 (일일 1회 무료 세션)
- `member`: 활성 멤버십 (무제한)

**⚠️ 결제 정책:**
- 정기구독: 월간(monthly)만 가능 (최대 3개월 운영 제한)
- 단건결제: 향후 연간(yearly) 1회성 결제 제공 예정

**권한 관리:**
- 중앙 집중식 권한 시스템 (`lib/permissions/`)
- `FeatureGuard` 컴포넌트로 접근 제어
- 기능별 권한 요구사항 정의 (`featurePermissions.ts`)

### 2. Firestore 데이터 구조

```
/users/{uid}
  ├── (profile fields)
  ├── /cards/{cardId}              # SRS 카드 상태
  ├── /membership/info             # 멤버십 (읽기 전용)
  ├── /usage/{YYYYMMDD}            # 일일 사용량 (읽기 전용)
  ├── /billing/info                # 🔒 결제 정보 (서버 전용)
  ├── /stats/{level|summary}       # 학습 통계
  ├── /dailyActivity/{YYYYMMDD}    # 일별 활동
  ├── /quiz/{doc}                  # 퀴즈 데이터
  └── /quizSessions/{sessionId}    # 퀴즈 세션 기록

/codes/{code}                       # 기프트 코드 (읽기 전용)
/admin/{document}                   # 🔒 관리자 데이터 (서버 전용)
```

**중요 필드:**
- 날짜 키: `YYYYMMDD` 형식 (예: "20251214")
- 타임스탬프: epoch milliseconds (일반)
- SRS 날짜: 일 단위 정수 (`todayAsDayNumber()`)

### 3. SRS (Spaced Repetition System)

**Anki/SM-2 스타일 알고리즘:**
- 학습 단계: 4시간 → 1일 → 3일
- 복습 단계: 간격 증가 (ease factor 기반)
- Leech 처리: `lapses >= 5` → `suspended = true`

**카드 상태:**
- `new`: 새 카드 (`cardState === null`)
- `learning`: 학습 중 (학습 단계 진행 중)
- `review`: 복습 대기 (`due <= now` && `!suspended`)
- `longTermMemory`: 장기 기억 (`interval >= 21일` || `reps >= 8`)
- `suspended`: Leech 처리 (`lapses >= 5`)

**카드 분류 로직:**
- 새 카드: `cardState === null` && `itemId`가 없음
- 복습 카드: `cardState.due <= now` && `!suspended` && `interval < 30일`
- 장기 기억: `interval >= 30일` || `reps >= 12`
- Leech: `lapses >= 5` → `suspended = true`

### 4. 보안 정책

**클라이언트 접근 차단:**
- `/users/{uid}/billing` - 결제 정보 (서버만)
- `/admin` - 관리자 데이터 (서버만)

**Firestore Rules:**
- 사용자 데이터: 본인만 read/write
- 멤버십/사용량: 본인 read, 서버만 write
- 결제/관리자: 클라이언트 완전 차단

---

## 주요 기능

### 학습 시스템
- **자동 학습**: SRS 기반 복습 큐 자동 생성
- **플래시카드**: 단어/한자 카드 학습
- **예문 학습**: 예문 기반 학습 모드
- **객관식 퀴즈**: 4지선다 문제

### 퀴즈 시스템
- **혼합 전략**: 랜덤 70% + 약점 30%
- **경험치/레벨**: 정답 시 경험치 획득, 레벨업
- **배지**: 24개 배지 (일반/레어/에픽/전설)
- **통계**: 레벨별/아이템별 정답률 추적

### 통계 시스템
- **일별 활동**: 학습 시간, 카드 수, 정확도
- **연속 일수**: 스트릭 추적
- **히트맵**: 연간 학습 활동 시각화
- **레벨별 통계**: N5~N1별 진행률

---

## 기술 스택

- **프레임워크**: Next.js 14.2.35 (App Router)
- **언어**: TypeScript 5.5.0
- **UI**: React 18.3.0, Tailwind CSS, Framer Motion
- **백엔드**: Firebase (Auth, Firestore)
- **PWA**: next-pwa
- **테스트**: Jest, React Testing Library

---

## 개발 가이드

### 권한 시스템 사용
```tsx
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

<FeatureGuard feature="study_session">
  <StudySession />
</FeatureGuard>
```

### SRS 카드 업데이트
```typescript
import { reviewCard } from '@/lib/srs/core/reviewCard'

const newState = reviewCard(cardState, 'good') // 'again' | 'hard' | 'good' | 'easy'
await saveCardState(uid, cardId, newState)
```

### Firestore 배치 저장
```typescript
import { saveCardStatesBatch } from '@/lib/firebase/firestore/cards'

await saveCardStatesBatch(uid, cardStates) // 자동 재시도 포함
```

### 테스트 실행
```bash
npm test                    # 모든 테스트
npm run test:watch         # Watch 모드
npm run test:coverage      # 커버리지 리포트
```

---

## 배포 체크리스트

- [ ] `.env.local` 환경변수 설정
- [ ] Firestore Rules 배포
- [ ] Firebase Authentication 활성화
- [ ] `/users/{uid}/billing` 클라이언트 접근 차단 확인
- [ ] `/admin` 컬렉션 클라이언트 접근 차단 확인
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 테스트 실행 (`npm test`)

---

## 브랜드 정보

**MoguMogu (모구모구)**는 "우물우물 먹다"는 의미의 언어 학습 플랫폼 브랜드입니다.

**브랜드 철학:**
- 꾸준함: 매일 조금씩, 우물우물
- 효율성: 간격 반복 학습(SRS)으로 장기 기억
- 즐거움: 부담 없이, 재미있게

**제품 네이밍:**
- 시험 대비: `Mogu-[시험명]` (예: Mogu-JLPT, Mogu-TOPIK)
- 일반 학습: `Mogu-[언어코드]` (예: Mogu-JP, Mogu-KR)

---

## 관련 문서

- **시스템 정책**: `SYSTEM_POLICIES.md` - 구독/권한/데이터 스키마 정책
- **Firestore 구조**: `FIRESTORE_COLLECTIONS.md` - 컬렉션 상세 설명
- **보안 규칙**: `../FIRESTORE_RULES.md` - Firestore Rules 가이드
- **Firebase 설정**: `../FIREBASE_SETUP.md` - 초기 설정 가이드
- **테스트 가이드**: `TESTING.md` - 테스트 작성/실행 방법
- **권한 시스템**: `../lib/permissions/README.md` - 권한 관리 상세
- **퀴즈 시스템**: `../lib/quiz/README.md` - 퀴즈 시스템 상세

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-14 | 3.0.0 | 통합 문서 작성 |
