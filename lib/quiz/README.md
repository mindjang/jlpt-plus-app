# 퀴즈 시스템 📚

JLPT Plus의 완전한 퀴즈 시스템 - 경험치, 레벨업, 배지로 학습 동기 부여!

## 주요 기능

### 🎯 혼합 전략 문제 출제
- 랜덤 70% + 약점 30% 비율로 자동 출제
- 틀린 문제를 더 자주 제시하여 약점 보완

### 📈 경험치 & 레벨 시스템
- 정답 시 경험치 획득
- 연속 정답 보너스
- 빠른 답변 시간 보너스
- 레벨업 시 축하 애니메이션

### 🏆 배지 시스템
- 24개의 다양한 배지
- 일반/레어/에픽/전설 등급
- 진행도 표시

### 📊 통계 & 약점 분석
- 레벨별 정답률 추적
- 아이템별 정답률 분석
- 약점 아이템 자동 추출

## 파일 구조

```
lib/
  types/
    quiz.ts - 퀴즈 타입 정의
  quiz/
    questionGenerator.ts - 문제 생성 엔진
    expSystem.ts - 경험치 시스템
    statsTracker.ts - 통계 추적
    badgeSystem.ts - 배지 시스템
    cache.ts - 캐싱 유틸리티
  firebase/
    firestore/
      quiz.ts - Firestore CRUD

components/
  quiz/
    QuizMenu.tsx - 메인 메뉴
    QuizSettings.tsx - 설정 모달
    QuizResult.tsx - 결과 화면
    LevelUpModal.tsx - 레벨업 모달
    BadgeGallery.tsx - 배지 갤러리
  study/
    QuizCard.tsx - 퀴즈 카드 UI

app/(root)/
  practice/
    quiz/page.tsx - 퀴즈 메인
  quiz/
    history/page.tsx - 히스토리
    badges/page.tsx - 배지 갤러리
    stats/page.tsx - 통계
```

## Firestore 구조

```
/users/{uid}/
  quizLevel/
    data - 사용자 레벨 정보 (경험치, 배지 등)
  quizStats/
    {level} - 레벨별 통계 (N5, N4, N3, N2, N1)
  quizHistory/
    {sessionId} - 세션별 기록
```

## 사용 흐름

1. `/practice/quiz` - 메인 메뉴
2. 퀴즈 시작 버튼 클릭
3. 설정 선택 (레벨, 문제 수, 유형)
4. 퀴즈 진행
5. 결과 확인 (경험치, 레벨업, 배지)
6. 히스토리/배지/통계 확인

## 성능 최적화

- 서버 사이드 메모리 캐싱 (5분 TTL)
- Firestore 읽기 최소화
- 문제 풀 사전 생성
- 배치 업데이트

## 확장 가능성

- 타이핑 퀀즈 추가
- 듣기 퀴즈 (음성 지원 시)
- 타임 어택 모드
- 멀티플레이어
- 일일 챌린지

