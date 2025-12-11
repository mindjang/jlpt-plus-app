# Mogu-JLPT - MoguMogu JLPT 시험 대비 학습 앱

**MoguMogu**는 "우물우물 먹다"는 의미의 언어 학습 플랫폼 브랜드입니다.  
**Mogu-JLPT**는 MoguMogu 시리즈 중 일본어 JLPT 시험 대비에 특화된 앱으로, 간격 반복 학습(SRS)을 활용한 효율적인 학습 경험을 제공합니다.

## 🌏 MoguMogu 시리즈

### 일본어
- **Mogu-JLPT** (현재) - JLPT 시험 대비 학습
- **Mogu-JP** (예정) - 일반 일본어 회화/독해 학습

### 기타 언어
- **Mogu-TOPIK** (예정) - 한국어 TOPIK 시험 대비
- **Mogu-KR** (예정) - 일반 한국어 학습
- **Mogu-HSK** (예정) - 중국어 HSK 시험 대비
- **Mogu-CN** (예정) - 일반 중국어 학습
- **Mogu-TOEFL** (예정) - 영어 TOEFL 시험 대비
- **Mogu-EN** (예정) - 일반 영어 학습

## ✨ 특징
미니멀리즘 디자인과 레벨 기반 컬러 시스템을 적용한 학습 최적화 UI를 제공합니다.

## 🎨 디자인 시스템 특징

### 브랜드 아이덴티티
- **고요한 미니멀리즘**: 학습에 방해 없는 깔끔한 디자인
- **레벨 기반 컬러 시스템**: N1~N5 각 레벨별 고유 색상
- **부드러운 시각감**: 곡선, 패딩, 소프트 쉐도우 중심
- **정보 구조 최적화**: 학습 루틴에 맞춘 직관적인 레이아웃

### 컬러 시스템
- **레벨 단색**: 리스트/검색에서 사용하는 단색 라벨
- **레벨 그라데이션**: 홈/자동학습 배경용 그라데이션
- **텍스트 계층**: Main / Sub / Hint 3단계

### 타이포그래피
- **일본어**: Noto Sans JP
- **한국어/영문**: Noto Sans KR (영문 fallback: Inter)
- **텍스트 스타일**: Display L/S, Title, Subtitle, Body, Label

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
jlpt-study-app/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 루트 페이지 (리다이렉트)
│   ├── layout.tsx         # 루트 레이아웃
│   ├── (mobile)/          # 모바일 사용자 그룹
│   │   ├── layout.tsx     # 모바일 레이아웃 (max-width 제한)
│   │   ├── page.tsx       # 모바일 홈 (N5~N1 캐러셀)
│   │   ├── auto-study/    # 자동 학습
│   │   ├── flashcard/      # 플래시카드 학습
│   │   ├── search/         # 검색
│   │   ├── word/           # 단어 상세
│   │   └── kana/           # 카나 학습
│   └── (admin)/            # 관리자 그룹
│       ├── layout.tsx     # 관리자 레이아웃 (풀페이지)
│       └── page.tsx       # 관리자 대시보드
├── components/
│   └── ui/                 # UI 컴포넌트
│       ├── AppBar.tsx      # 앱 바 (햄버거 메뉴 포함)
│       ├── FlashCard.tsx
│       ├── KanaGrid.tsx
│       ├── KanjiDetail.tsx
│       ├── LevelCard.tsx   # 레벨 카드 (단어/한자 수 표시)
│       ├── LevelChip.tsx
│       ├── ListItem.tsx
│       ├── Modal.tsx
│       ├── SearchBar.tsx
│       └── StreakChip.tsx  # 불꽃 아이콘 칩
├── tailwind.config.js      # Tailwind 디자인 토큰
└── app/globals.css         # 글로벌 스타일
```

## 🎯 라우팅 구조

### 모바일 (사용자)
- `/mobile` - 홈 화면 (N5~N1 레벨 캐러셀)
- `/mobile/auto-study/[level]` - 자동 학습
- `/mobile/flashcard/[level]` - 플래시카드 학습
- `/mobile/search` - 검색
- `/mobile/word/[word]` - 단어 상세
- `/mobile/kana` - 카나 학습

### 관리자
- `/admin` - 관리자 대시보드 (풀페이지)

### 레이아웃 차이
- **모바일**: `max-w-md` (모바일 크기로 제한, 웹에서도 모바일 크기 유지)
- **관리자**: 풀페이지 (전체 화면 사용)

## 🧩 컴포넌트 시스템

### 레벨 카드 (LevelCard)
홈 캐러셀에서 사용하는 레벨 선택 카드
- 4:5 비율
- 레벨별 그라데이션 배경
- 단어/한자 수 표시 (예: "527단어·80한자")
- 캐릭터 일러스트 포함 (웃는 점얼굴)
- N5부터 N1까지 순서

### 플래시카드 (FlashCard)
학습용 플래시카드 컴포넌트
- 진행도 바
- 의미/히라가나 토글
- 학습 액션 버튼

### 리스트 아이템 (ListItem)
단어/한자 리스트 표시
- 레벨 칩
- 단어 + 후리가나
- 의미 표시

### 카나 그리드 (KanaGrid)
히라가나/가타카나 그리드 레이아웃
- 4-6열 그리드
- 72×72px 아이템
- 클릭 인터랙션

### 한자 상세 (KanjiDetail)
한자 상세 정보 표시
- 음독/훈독 칩
- 부수 정보
- 활용 단어 리스트
- 외부 링크 (네이버 사전, ChatGPT)

## 🎯 페이지 패턴

1. **홈 패턴**: 
   - 상단 Streak 칩 (불꽃 아이콘)
   - 레벨 캐러셀 (N5~N1)
   - 페이지 인디케이터
   - 햄버거 메뉴
2. **자동 학습 패턴**: 레벨별 그라데이션 + 게이지 + 학습 버튼
3. **플래시카드 패턴**: 카드 중앙 배치 + 진행도 + 액션 버튼
4. **검색 패턴**: 검색 바 + 레벨 칩 + 리스트
5. **상세 패턴**: 타이틀 + 레벨 라벨 + 정보 칩 + 관련 리스트
6. **카나 패턴**: 카테고리 탭 + 그리드 + 모달

## 🎨 디자인 토큰

Tailwind 설정 파일(`tailwind.config.js`)에 모든 디자인 토큰이 정의되어 있습니다:

- **컬러**: 레벨 색상, 표면 색상, 텍스트 색상
- **타이포그래피**: 폰트 패밀리, 크기, 두께, 줄 간격
- **간격**: 패딩, 마진 값
- **라운드**: 카드, 칩, 검색 바 등
- **그림자**: 소프트 쉐도우

## 📱 반응형 디자인

모바일 우선 설계로 구현되어 있으며, 뷰포트 기반 크기 조정을 지원합니다.

## 🔧 기술 스택

- **Next.js 14**: App Router
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Framer Motion**: 애니메이션
- **Firebase**: Auth (Google + 이메일/비밀번호), Firestore (학습 상태 저장)
- **Anki/SM-2 SRS**: 간격 반복 학습 알고리즘

## 🔐 Firebase 설정

1. Firebase 프로젝트 생성 및 설정
2. `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Firebase Console에서 Authentication 활성화:
   - Google 로그인 제공업체 활성화
   - 이메일/비밀번호 제공업체 활성화

4. Firestore 데이터베이스 생성 (테스트 모드 또는 보안 규칙 설정)

## 📚 SRS (Spaced Repetition System)

Anki/SM-2 스타일의 간격 반복 학습 시스템을 구현했습니다.

### 주요 기능
- **복습 큐**: 오늘 복습해야 할 카드 자동 생성
- **새 카드 큐**: 일일 학습 제한에 따른 새 카드 제공
- **학습 상태 추적**: 각 카드별 복습 횟수, 간격, 난이도 계수 관리
- **Leech 처리**: 자주 틀리는 카드 자동 숨김

### 학습 모드
1. **예문 기반 학습**: 예문을 보여주고 뜻/읽기를 떠올리는 방식
2. **객관식 퀴즈**: 4지선다 문제로 학습

### 평가 시스템
- **Again**: 틀림 (다음날 다시)
- **Hard**: 어려움 (간격 감소)
- **Good**: 보통 (정상 간격)
- **Easy**: 매우 쉬움 (간격 증가)

## 📁 새로운 프로젝트 구조

```
jlpt-study-app/
├── lib/
│   ├── firebase/          # Firebase 설정 및 유틸
│   │   ├── config.ts      # Firebase 초기화
│   │   ├── auth.ts        # 인증 함수
│   │   └── firestore.ts   # Firestore CRUD
│   ├── srs/               # SRS 로직
│   │   ├── reviewCard.ts  # Anki/SM-2 알고리즘
│   │   ├── cardStatus.ts  # 카드 상태 판정
│   │   └── studyQueue.ts  # 학습 큐 생성
│   ├── types/             # 타입 정의
│   │   ├── content.ts     # Word, Kanji 타입
│   │   ├── srs.ts         # SRS 관련 타입
│   │   └── user.ts        # 유저 타입
│   └── utils/             # 유틸 함수
├── components/
│   ├── auth/              # 인증 컴포넌트
│   │   ├── AuthProvider.tsx
│   │   └── LoginForm.tsx
│   └── study/             # 학습 컴포넌트
│       ├── ExampleCard.tsx
│       ├── QuizCard.tsx
│       └── StudySession.tsx
└── app/
    └── (mobile)/
        └── study/[level]/  # 학습 페이지
```

## 🧪 테스트 계정

개발 및 테스트를 위한 임시 계정 정보는 `TEST_ACCOUNT.md` 파일을 참고하세요.

**테스트 계정**:
- 이메일: `test@mogumogu.com`
- 비밀번호: `test123456`

> ⚠️ 이 계정은 개발/테스트 전용입니다. 프로덕션 환경에서는 사용하지 마세요.

---

## 📘 추가 문서

- [브랜드 가이드](./docs/BRAND_GUIDE.md) - MoguMogu 브랜드 네이밍 및 사용 규칙
- [SRS 알고리즘](./docs/ANKI_SRS_IMPLEMENTATION.md) - 간격 반복 학습 구현
- [카드 분류](./docs/CARD_CATEGORY_ALGORITHM.md) - 카드 상태 판정 알고리즘

## 📄 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.


