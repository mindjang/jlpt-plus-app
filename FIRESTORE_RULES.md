# Firestore 보안 규칙 가이드

## 🔒 보안 원칙

이 프로젝트는 민감한 결제 정보를 보호하기 위해 계층적 보안 규칙을 사용합니다.

## 📋 컬렉션별 접근 권한

### 클라이언트 접근 가능 (사용자 본인만)

| 컬렉션 | 경로 | 읽기 | 쓰기 | 설명 |
|--------|------|------|------|------|
| Profile | `/users/{uid}` | ✅ 본인 | ✅ 본인 | 사용자 프로필 정보 |
| Cards | `/users/{uid}/cards/{cardId}` | ✅ 본인 | ✅ 본인 | SRS 학습 카드 상태 |
| Stats | `/users/{uid}/stats/{doc}` | ✅ 본인 | ✅ 본인 | 학습 통계 |
| Daily Activity | `/users/{uid}/dailyActivity/{dateKey}` | ✅ 본인 | ✅ 본인 | 일별 활동 기록 |
| Quiz | `/users/{uid}/quiz/{doc}` | ✅ 본인 | ✅ 본인 | 퀴즈 데이터 |
| Quiz Sessions | `/users/{uid}/quizSessions/{sessionId}` | ✅ 본인 | ✅ 본인 | 퀴즈 세션 기록 |

### 클라이언트 읽기 전용

| 컬렉션 | 경로 | 읽기 | 쓰기 | 설명 |
|--------|------|------|------|------|
| Membership | `/users/{uid}/membership/{doc}` | ✅ 본인 | ❌ 서버만 | 멤버십 상태 (만료일 등) |
| Usage | `/users/{uid}/usage/{dateKey}` | ✅ 본인 | ❌ 서버만 | 일일 무료 세션 사용량 |
| Gift Codes | `/codes/{code}` | ✅ 인증된 사용자 | ❌ 서버만 | 쿠폰 코드 (중복 방지) |

### 서버 전용 (클라이언트 접근 불가)

| 컬렉션 | 경로 | 읽기 | 쓰기 | 설명 |
|--------|------|------|------|------|
| **Billing** | `/users/{uid}/billing/{doc}` | ❌ 서버만 | ❌ 서버만 | **billingKey 등 민감 정보** |
| Admin | `/admin/{document}` | ❌ 서버만 | ❌ 서버만 | 관리자 데이터 |

## ⚠️ 중요: Billing 컬렉션

### 왜 차단하나요?

`billing` 컬렉션에는 다음과 같은 민감 정보가 저장됩니다:

- `billingKey`: 정기결제용 빌링키 (이 키로 결제 가능)
- `lastPaymentId`: 결제 이력
- `amount`: 결제 금액

**만약 클라이언트에서 읽을 수 있다면:**
- 악의적인 사용자가 브라우저 개발자 도구로 billingKey를 탈취 가능
- 탈취된 billingKey로 무단 결제 시도 가능
- 개인정보 보호법/결제 규정 위반

### 올바른 사용법

✅ **서버 API 라우트에서만 사용:**

```typescript
// app/api/pay/subscribe/route.ts (서버)
import { saveBillingInfo } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
  const [user, authError] = await requireAuth(request)
  if (authError) return authError
  
  // 서버에서 Admin SDK 사용 → Firestore Rules 무시하고 접근 가능
  await saveBillingInfo(user.uid, {
    billingKey: '...',
    // ...
  })
}
```

❌ **클라이언트에서 절대 사용 금지:**

```typescript
// 클라이언트 컴포넌트에서 이렇게 쓰면 안 됨!
const billing = await getBillingInfo(user.uid) // ❌ permission-denied 에러
```

## 🔄 배포 방법

### 1. Firebase Console에서 규칙 업데이트

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. **Firestore Database** > **Rules** 탭
4. `firestore.rules` 파일 내용 복사/붙여넣기
5. **게시** 버튼 클릭

### 2. 규칙 시뮬레이터로 테스트

Firebase Console의 Rules 탭에서 **Rules Playground** 사용:

```
// 테스트 시나리오
Location: /users/test-uid/billing/info
Method: get
Auth: Authenticated as test-uid

Expected: ❌ Permission denied (정상)
```

## 🧪 로컬 개발

Firebase Emulator를 사용하는 경우:

```bash
# firebase.json에 rules 경로 지정
{
  "firestore": {
    "rules": "firestore.rules"
  }
}

# 에뮬레이터 실행
firebase emulators:start
```

## 📚 참고

- [Firestore 보안 규칙 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [결제 정보 보안 가이드](https://stripe.com/docs/security/guide)
