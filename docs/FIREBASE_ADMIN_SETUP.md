# Firebase Admin SDK 설정 가이드

## 문제 증상

모바일 앱에서 카카오페이 결제 후 다음과 같은 오류가 발생하는 경우:

```
[firebase-admin] credentials not configured. API routes will reject requests until configured.
Token verification failed: Firebase Admin is not configured.
POST /api/pay/subscribe 401
```

이 오류는 Firebase Admin SDK가 제대로 초기화되지 않아서 발생합니다.

## 해결 방법

### 1. Firebase Console에서 서비스 계정 키 생성

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. 프로젝트 선택
3. **프로젝트 설정** (⚙️ 아이콘) > **서비스 계정** 탭
4. **새 비공개 키 생성** 클릭
5. JSON 파일이 다운로드됩니다

### 2. 환경 변수 설정

#### 방법 A: JSON 내용을 환경 변수로 설정 (권장)

`.env.local` 파일에 다음을 추가:

```bash
# Firebase Admin SDK 설정
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**주의**: JSON 내용을 한 줄로 변환하고 작은따옴표로 감싸야 합니다.

#### 방법 B: JSON 파일 경로 사용

서비스 계정 JSON 파일을 프로젝트 루트에 저장하고 (`.gitignore`에 추가됨):

```bash
# .env.local
FIREBASE_SERVICE_ACCOUNT_PATH=./your-service-account-key.json
```

그리고 `lib/firebase/admin.ts`를 수정하여 파일 경로를 읽도록 변경합니다.

#### 방법 C: Application Default Credentials (개발 환경)

Google Cloud CLI를 사용하는 경우:

```bash
# gcloud CLI 설치 후
gcloud auth application-default login

# .env.local
FIREBASE_PROJECT_ID=your-project-id
```

### 3. 환경 변수 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 다음 명령으로 환경 변수가 로드되는지 확인:

```bash
# 개발 서버 재시작
npm run dev
```

### 4. 프로덕션 환경 설정

#### Vercel

1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. `FIREBASE_SERVICE_ACCOUNT` 추가
3. Value에 JSON 내용을 한 줄로 입력 (따옴표 포함)

#### 다른 호스팅 서비스

환경 변수 설정 방법은 각 서비스 문서를 참조하세요.

## 확인 방법

서버 로그에서 다음 메시지가 보이지 않으면 성공:

```
[firebase-admin] credentials not configured. API routes will reject requests until configured.
```

대신 다음과 같은 메시지가 보이면 정상입니다:

```
[firebase-admin] initialized successfully
```

## 주의사항

- 서비스 계정 키는 **절대 Git에 커밋하지 마세요**
- `.gitignore`에 `*-firebase-adminsdk-*.json` 패턴이 이미 추가되어 있습니다
- 환경 변수는 `.env.local`에만 저장하고 `.env`에는 저장하지 마세요
