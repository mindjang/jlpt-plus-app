# Mogu-JLPT - MoguMogu JLPT 시험 대비 학습 앱

**MoguMogu**는 "우물우물 먹다"는 의미의 언어 학습 플랫폼 브랜드입니다.  
**Mogu-JLPT**는 MoguMogu 시리즈 중 일본어 JLPT 시험 대비에 특화된 앱으로, 간격 반복 학습(SRS)을 활용한 효율적인 학습 경험을 제공합니다.

## 🚀 빠른 시작

### 설치 및 실행
```bash
npm install
npm run dev  # 개발 서버: http://localhost:3000
npm run build  # 프로덕션 빌드
npm test  # 테스트 실행
```

### Firebase 설정
1. `.env.local` 파일 생성 (환경변수 설정)
2. Firebase Console에서 Authentication 및 Firestore 활성화
3. 상세 설정은 [문서](./docs/README.md#firebase-설정) 참고

## ✨ 주요 기능

- **SRS 기반 학습**: Anki/SM-2 스타일 간격 반복 학습
- **퀴즈 시스템**: 경험치, 레벨업, 배지로 동기 부여
- **통계 분석**: 학습 활동, 진행률, 약점 분석
- **게임 모드**: Word Blast, Flash Quiz, Word Match

## 🔧 기술 스택

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Firebase** (Auth, Firestore)
- **PWA** 지원

## 📚 문서

**📖 [통합 문서](./docs/README.md)** - 프로젝트 전체 가이드

### 상세 문서
- [시스템 정책](./docs/SYSTEM_POLICIES.md) - 구독/권한/데이터 스키마 정책
- [Firestore 구조](./docs/FIRESTORE_COLLECTIONS.md) - 데이터베이스 구조
- [보안 규칙](../FIRESTORE_RULES.md) - Firestore 보안 규칙
- [Firebase 설정](../FIREBASE_SETUP.md) - 초기 설정 가이드
- [테스트 가이드](./docs/TESTING.md) - 테스트 작성/실행
- [브랜드 가이드](./docs/BRAND_GUIDE.md) - MoguMogu 브랜드 가이드
- [카드 분류 알고리즘](./docs/CARD_CATEGORY_ALGORITHM.md) - SRS 카드 분류

## 🧪 테스트 계정

- 이메일: `test@jlpt-plus.app`
- 비밀번호: `test123456`

> ⚠️ 개발/테스트 전용입니다. 프로덕션 환경에서는 사용하지 마세요.

## 📄 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.


