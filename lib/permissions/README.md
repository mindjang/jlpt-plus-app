# 권한 관리 시스템

모든 기능의 접근 권한을 중앙에서 관리하는 시스템입니다.

## 📋 목차

- [개요](#개요)
- [기능 추가하기](#기능-추가하기)
- [사용 방법](#사용-방법)
- [API 레퍼런스](#api-레퍼런스)

## 개요

이 시스템은 다음과 같은 장점을 제공합니다:

1. **중앙 관리**: 모든 기능 권한이 `featurePermissions.ts` 한 곳에 정의됨
2. **확장성**: 새로운 기능 추가가 간단함
3. **일관성**: 모든 권한 체크가 동일한 로직 사용
4. **타입 안정성**: TypeScript로 완전한 타입 지원

## 기능 추가하기

### 1. FeatureId에 추가

`lib/permissions/types.ts`의 `FeatureId` 타입에 새 기능을 추가합니다:

```typescript
export type FeatureId =
  | 'study_session'
  | 'unlimited_sessions'
  | 'my_new_feature' // 새 기능 추가
```

### 2. 권한 요구사항 정의

`lib/permissions/featurePermissions.ts`에 권한 요구사항을 추가합니다:

```typescript
export const FEATURE_PERMISSIONS: Record<FeatureId, FeatureRequirement> = {
  // ... 기존 기능들
  
  my_new_feature: {
    minStatus: 'member', // 'guest' | 'nonMember' | 'expired' | 'member'
    restrictionMessage: {
      title: '프리미엄 회원만 이용할 수 있어요',
      description: '회원권을 등록하면 이 기능을 이용할 수 있어요.',
    },
    // 선택: 커스텀 체크 로직
    customCheck: (context) => {
      // 추가 조건이 필요한 경우
      return context.isMember && context.membership?.type === 'yearly'
    },
  },
}
```

### 3. 사용하기

컴포넌트에서 사용:

```tsx
import { useFeatureAccess } from '@/lib/permissions'

function MyComponent() {
  const access = useFeatureAccess('my_new_feature')
  
  if (!access.allowed) {
    return <PaywallOverlay title={access.message?.title} />
  }
  
  return <div>프리미엄 기능 컨텐츠</div>
}
```

또는 `FeatureGuard` 사용:

```tsx
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

function MyComponent() {
  return (
    <FeatureGuard feature="my_new_feature">
      <div>프리미엄 기능 컨텐츠</div>
    </FeatureGuard>
  )
}
```

## 사용 방법

### Hook 사용

#### 단일 기능 체크

```tsx
import { useFeatureAccess } from '@/lib/permissions'

function MyComponent() {
  const access = useFeatureAccess('study_session')
  
  if (access.allowed) {
    // 기능 사용 가능
  } else {
    // 접근 불가
    console.log(access.reason) // 'not_logged_in' | 'membership_required' | ...
    console.log(access.message) // { title, description }
  }
}
```

#### 간단한 boolean 체크

```tsx
import { useCanAccessFeature } from '@/lib/permissions'

function MyComponent() {
  const canAccess = useCanAccessFeature('study_session')
  
  return canAccess ? <PremiumFeature /> : <PaywallOverlay />
}
```

#### 여러 기능 동시 체크

```tsx
import { useMultipleFeatureAccess } from '@/lib/permissions'

function MyComponent() {
  const access = useMultipleFeatureAccess(['study_session', 'advanced_stats'])
  
  if (access.study_session.allowed && access.advanced_stats.allowed) {
    // 두 기능 모두 사용 가능
  }
}
```

### FeatureGuard 컴포넌트

#### 기본 사용

```tsx
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

function MyPage() {
  return (
    <FeatureGuard feature="study_session">
      <StudySession />
    </FeatureGuard>
  )
}
```

#### 커스텀 fallback

```tsx
<FeatureGuard 
  feature="study_session"
  fallback={<CustomBlockedScreen />}
>
  <StudySession />
</FeatureGuard>
```

#### 커스텀 메시지

```tsx
<FeatureGuard 
  feature="study_session"
  customMessage={{
    title: '학습을 시작할 수 없어요',
    description: '로그인 후 이용해주세요.',
  }}
>
  <StudySession />
</FeatureGuard>
```

#### 조건부 렌더링

```tsx
<FeatureGuard 
  feature="study_session"
  renderCondition={(allowed) => {
    // 추가 조건 로직
    return allowed && someOtherCondition
  }}
>
  <StudySession />
</FeatureGuard>
```

### 직접 권한 체크 (서버 사이드 등)

```typescript
import { checkFeatureAccess } from '@/lib/permissions'
import type { PermissionContext } from '@/lib/permissions'

const context: PermissionContext = {
  status: 'member',
  isMember: true,
  canStartSession: true,
  remainingSessions: Infinity,
  user: { uid: 'user123' },
  membership: {
    expiresAt: Date.now() + 86400000,
    type: 'monthly',
    source: 'subscription',
  },
}

const result = checkFeatureAccess('study_session', context)
if (result.allowed) {
  // 접근 허용
}
```

## API 레퍼런스

### Types

#### `FeatureId`

기능 식별자 타입. 새 기능 추가 시 여기에 추가해야 합니다.

#### `FeatureRequirement`

```typescript
interface FeatureRequirement {
  minStatus: MembershipStatus // 최소 필요한 멤버십 상태
  customCheck?: (context: PermissionContext) => boolean // 추가 조건
  restrictionMessage?: { title: string; description: string } // 제한 메시지
}
```

#### `FeatureAccessResult`

```typescript
interface FeatureAccessResult {
  allowed: boolean // 접근 가능 여부
  reason?: 'not_logged_in' | 'membership_required' | 'session_limit' | 'custom_check_failed'
  message?: { title: string; description: string }
}
```

### Functions

#### `checkFeatureAccess(featureId, context)`

권한 체크 함수. 서버 사이드나 직접 체크가 필요한 경우 사용.

#### `canAccessFeature(featureId, context)`

간단한 boolean 반환 버전.

### Hooks

#### `useFeatureAccess(featureId)`

단일 기능 접근 권한을 체크하는 Hook. `FeatureAccessResult` 반환.

#### `useCanAccessFeature(featureId)`

간단한 boolean 반환 Hook.

#### `useMultipleFeatureAccess(featureIds)`

여러 기능의 접근 권한을 한 번에 체크하는 Hook.

### Components

#### `FeatureGuard`

권한 기반 컴포넌트 가드. 접근 불가 시 자동으로 적절한 UI를 표시합니다.

**Props:**
- `feature: FeatureId` - 체크할 기능 ID
- `fallback?: React.ReactNode` - 커스텀 fallback 컴포넌트
- `customMessage?: { title?: string; description?: string }` - 커스텀 메시지
- `renderCondition?: (allowed: boolean) => boolean` - 추가 렌더링 조건

## 예시: 실제 사용 사례

### 학습 세션 시작

```tsx
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

function StudyPage() {
  return (
    <FeatureGuard feature="study_session">
      <StudySession />
    </FeatureGuard>
  )
}
```

### 프리미엄 통계 페이지

```tsx
import { useFeatureAccess } from '@/lib/permissions'

function StatsPage() {
  const access = useFeatureAccess('advanced_stats')
  
  if (!access.allowed) {
    return <PaywallOverlay {...access.message} />
  }
  
  return <AdvancedStats />
}
```

### 조건부 기능 표시

```tsx
import { useCanAccessFeature } from '@/lib/permissions'

function SettingsPage() {
  const canExport = useCanAccessFeature('export_data')
  const canCustomize = useCanAccessFeature('custom_settings')
  
  return (
    <div>
      {canExport && <ExportButton />}
      {canCustomize && <CustomSettingsPanel />}
    </div>
  )
}
```

## 마이그레이션 가이드

기존 코드를 새로운 권한 시스템으로 마이그레이션하는 방법:

### Before

```tsx
const { isMember, canStartSession } = useMembership()

if (!isMember) {
  return <PaywallOverlay />
}

if (!canStartSession) {
  return <SessionLimitReached />
}
```

### After

```tsx
import { FeatureGuard } from '@/components/permissions/FeatureGuard'

<FeatureGuard feature="study_session">
  {/* 컨텐츠 */}
</FeatureGuard>
```

또는

```tsx
import { useFeatureAccess } from '@/lib/permissions'

const access = useFeatureAccess('study_session')
if (!access.allowed) {
  return <PaywallOverlay {...access.message} />
}
```

## 주의사항

1. **새 기능 추가 시**: 반드시 `FeatureId` 타입과 `FEATURE_PERMISSIONS`에 모두 추가해야 합니다.
2. **커스텀 체크**: 복잡한 조건이 필요한 경우 `customCheck`를 사용하세요.
3. **성능**: Hook은 내부적으로 `useMemo`를 사용하므로 불필요한 재계산을 방지합니다.
4. **타입 안정성**: TypeScript를 사용하면 컴파일 타임에 오류를 잡을 수 있습니다.
