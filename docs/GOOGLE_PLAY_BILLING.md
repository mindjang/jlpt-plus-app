# Google Play Billing 통합 가이드

PWA가 TWA(Trusted Web Activity)로 구글 플레이스토어에 설치된 경우, Google Play Billing을 사용하여 결제를 처리할 수 있습니다.

## 구현 내용

### 1. TWA 환경 감지
- `lib/utils/google-play-billing.ts`의 `isTWA()` 함수로 TWA 환경 감지
- Android 환경 + standalone 모드 또는 android-app:// referrer 체크

### 2. Google Play Billing API
- Digital Goods API를 사용하여 구글 플레이스토어 결제 처리
- `purchaseSubscription()`: 구독 구매
- `getActiveSubscriptions()`: 활성 구독 조회
- `cancelSubscription()`: 구독 취소

### 3. 자동 폴백
- TWA 환경이 아니거나 Google Play Billing을 사용할 수 없는 경우
- 자동으로 기존 PortOne 결제로 폴백

## 설정 방법

### 1. 환경변수 설정

`.env.local` 파일에 다음 환경변수를 추가하세요:

```bash
# Google Play Billing 상품 ID
NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_MONTHLY=monthly_subscription
NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_QUARTERLY=quarterly_subscription
```

### 2. Google Play Console에서 상품 ID 발급받기

#### 단계별 가이드

1. **Google Play Console 접속**
   - [Google Play Console](https://play.google.com/apps/publish/)에 접속
   - 개발자 계정으로 로그인 (없으면 $25 등록비로 계정 생성 필요)

2. **앱 선택**
   - 대시보드에서 결제를 구현할 앱 선택
   - 앱이 없으면 먼저 앱을 등록해야 함

3. **구독 상품 생성**
   - 왼쪽 메뉴에서 **"수익 창출"** 또는 **"제품"** > **"구독"** 선택
   - **"구독 만들기"** 또는 **"새 구독 추가"** 버튼 클릭

4. **상품 ID 입력**
   - **제품 ID** 필드에 고유한 ID 입력
     - 예: `monthly_subscription`, `quarterly_subscription`
     - 또는: `mogu_jlpt_monthly`, `mogu_jlpt_quarterly`
   - ⚠️ **주의**: 상품 ID는 한 번 생성하면 변경할 수 없습니다!
   - 소문자, 숫자, 언더스코어(_)만 사용 가능

5. **구독 정보 입력**
   - **이름**: 사용자에게 표시될 이름 (예: "1개월 구독", "3개월 구독")
   - **설명**: 구독에 대한 설명
   - **가격**: 구독 가격 설정
   - **청구 주기**: 1개월 또는 3개월 등

6. **저장 및 활성화**
   - 모든 정보 입력 후 저장
   - 구독을 **활성화** 상태로 변경

7. **상품 ID 확인**
   - 구독 목록에서 생성한 구독의 **제품 ID** 확인
   - 이 ID를 환경변수에 설정

#### 예시

```
제품 ID: monthly_subscription
이름: 1개월 구독
가격: 9,900원
청구 주기: 1개월

제품 ID: quarterly_subscription  
이름: 3개월 구독
가격: 13,900원
청구 주기: 3개월
```

#### 환경변수 설정

생성한 제품 ID를 `.env.local`에 설정:

```bash
NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_MONTHLY=monthly_subscription
NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_QUARTERLY=quarterly_subscription
```

⚠️ **중요**: 
- 제품 ID는 Google Play Console에서 생성한 것과 **정확히 일치**해야 합니다
- 대소문자를 구분하므로 정확히 입력하세요
- 테스트용으로는 "테스트 구독"을 사용할 수 있습니다

### 3. TWA 설정 (필요한 경우)

PWA를 TWA로 배포하려면:
- Android 앱으로 패키징 (예: Bubble, PWABuilder 사용)
- Google Play Console에 앱 등록
- Digital Asset Links 설정

## 사용 방법

결제 버튼을 클릭하면:
1. TWA 환경인지 자동 감지
2. Google Play Billing 사용 가능 여부 확인
3. 가능하면 구글 플레이스토어 결제 창 표시
4. 불가능하면 기존 PortOne 결제로 폴백

사용자는 별도의 설정 없이 자동으로 적절한 결제 방법을 사용합니다.

## 서버 사이드 검증 (향후 구현)

현재는 클라이언트에서 받은 구매 토큰을 그대로 사용하지만, 프로덕션 환경에서는 Google Play Developer API를 사용하여 서버 사이드 검증을 구현해야 합니다.

```typescript
// app/api/pay/google-play/route.ts의 TODO 참고
// Google Play Developer API를 통한 구매 토큰 검증 필요
```

## 주의사항

1. **테스트 환경**: Google Play Billing은 실제 구글 플레이스토어에 등록된 앱에서만 작동합니다. 로컬 개발 환경에서는 테스트할 수 없습니다.

2. **상품 ID**: Google Play Console에서 생성한 실제 상품 ID를 사용해야 합니다.

3. **서버 검증**: 프로덕션 환경에서는 반드시 서버 사이드 검증을 구현해야 합니다.

4. **환경 감지**: TWA 환경 감지는 완벽하지 않을 수 있습니다. 필요시 수동으로 강제할 수 있습니다.

## 문제 해결

### Google Play Billing이 작동하지 않는 경우

1. TWA 환경인지 확인: `isTWA()` 함수가 `true`를 반환하는지 확인
2. Digital Goods API 사용 가능 여부 확인: 브라우저 콘솔에서 확인
3. 상품 ID 확인: Google Play Console의 상품 ID와 환경변수가 일치하는지 확인
4. 자동 폴백: 기존 PortOne 결제로 자동 전환됩니다

### 디버깅

브라우저 콘솔에서 다음 로그를 확인하세요:
- `[Payment] Attempting Google Play Billing`
- `[Payment] Google Play subscription completed successfully`
- `[GooglePlayBilling] Service not available` (오류 시)

