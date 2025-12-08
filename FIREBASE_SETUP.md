# Firebase 설정 가이드

## 🔴 오류 해결: auth/operation-not-allowed

이 오류는 Firebase Console에서 이메일/비밀번호 인증이 활성화되지 않았을 때 발생합니다.

### 해결 방법

1. **Firebase Console 접속**
   - https://console.firebase.google.com 접속
   - 프로젝트 선택

2. **Authentication 활성화**
   - 왼쪽 메뉴에서 "Authentication" 클릭
   - "Get started" 버튼 클릭 (처음 사용 시)

3. **이메일/비밀번호 인증 활성화**
   - "Sign-in method" 탭 클릭
   - "Email/Password" 제공업체 찾기
   - "Email/Password" 클릭
   - "Enable" 토글을 **ON**으로 설정
   - "Save" 클릭

4. **Google 로그인 활성화 (선택사항)**
   - "Google" 제공업체 클릭
   - "Enable" 토글을 **ON**으로 설정
   - 프로젝트 지원 이메일 설정 (필수)
   - "Save" 클릭

## 📋 전체 설정 체크리스트

### 1. Firebase 프로젝트 생성
- [ ] Firebase Console에서 프로젝트 생성
- [ ] 프로젝트 ID 확인

### 2. 웹 앱 추가
- [ ] 프로젝트 설정 > 일반 > 앱 추가 > 웹 앱
- [ ] 앱 닉네임 입력
- [ ] Firebase SDK 설정 복사

### 3. 환경 변수 설정
- [ ] `.env.local` 파일 생성
- [ ] Firebase 설정 값 입력:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
  ```

### 4. Authentication 설정
- [ ] Authentication 활성화
- [ ] 이메일/비밀번호 제공업체 활성화
- [ ] Google 제공업체 활성화 (선택사항)

### 5. Firestore 설정
- [ ] Firestore Database 생성
- [ ] 테스트 모드로 시작 (개발용)
- [ ] 보안 규칙 설정 (`firestore.rules.example` 참고)

### 6. 테스트 계정 생성
- [ ] Authentication > Users > Add user
- [ ] 이메일: `test@jlpt-plus.app`
- [ ] 비밀번호: `test123456`
- [ ] 또는 앱에서 직접 회원가입

## 🔒 Firestore 보안 규칙

Firebase Console > Firestore Database > Rules에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 유저 문서: 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 유저의 카드 컬렉션: 본인만 읽기/쓰기 가능
      match /cards/{cardId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🧪 테스트

설정 완료 후:
1. 개발 서버 실행: `npm run dev`
2. `/home` 페이지 접속
3. 로그인 폼에 테스트 계정 정보가 미리 입력되어 있음
4. "로그인" 또는 "회원가입" 버튼 클릭
5. 정상 작동 확인

## ❗ 자주 발생하는 오류

### auth/operation-not-allowed
- **원인**: 이메일/비밀번호 인증이 비활성화됨
- **해결**: Authentication > Sign-in method > Email/Password > Enable

### auth/api-key-not-valid
- **원인**: 잘못된 API 키 또는 환경 변수 미설정
- **해결**: `.env.local` 파일 확인 및 Firebase 설정 값 재확인

### Firestore permission denied
- **원인**: 보안 규칙이 설정되지 않음
- **해결**: Firestore Rules 설정 (위 참고)

