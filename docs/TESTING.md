# 테스트 가이드

이 문서는 Mogu-JLPT 프로젝트의 테스트 코드 작성 및 실행 방법을 설명합니다.

## 테스트 환경

- **Jest**: JavaScript 테스트 프레임워크
- **React Testing Library**: React 컴포넌트 테스트
- **ts-jest**: TypeScript 지원

## 테스트 실행

### 모든 테스트 실행
```bash
npm test
```

### Watch 모드 (파일 변경 시 자동 실행)
```bash
npm run test:watch
```

### 커버리지 리포트 생성
```bash
npm run test:coverage
```

## 테스트 구조

### 파일 위치
테스트 파일은 다음 위치에 있습니다:
- `lib/**/__tests__/*.test.ts` - 단위 테스트
- `components/**/__tests__/*.test.tsx` - 컴포넌트 테스트

### 테스트 파일 네이밍
- `*.test.ts` 또는 `*.spec.ts`
- 예: `reviewCard.test.ts`, `permissionChecker.spec.ts`

## 작성된 테스트

### 1. SRS 알고리즘 테스트 ✅
**파일**: `lib/srs/core/__tests__/reviewCard.test.ts`

**테스트 내용**:
- 새 카드 초기화
- 학습 단계 진행 (4시간 → 1일 → 3일)
- 복습 단계 간격 계산
- Ease Factor 조정
- Leech 처리

**실행 예시**:
```bash
npm test reviewCard
```

### 2. 권한 체크 테스트 ✅
**파일**: `lib/permissions/__tests__/permissionChecker.test.ts`

**테스트 내용**:
- 로그인 상태별 접근 권한
- `study_session` 커스텀 체크
- 회원/비회원 권한 구분

**실행 예시**:
```bash
npm test permissionChecker
```

### 3. 재시도 메커니즘 테스트 ✅
**파일**: `lib/utils/__tests__/retry.test.ts`

**테스트 내용**:
- 성공하는 함수 즉시 반환
- 재시도 가능한 에러 처리
- 재시도 불가능한 에러 즉시 throw
- 지수 백오프 동작

**실행 예시**:
```bash
npm test retry
```

### 4. 중복 요청 방지 테스트 ✅
**파일**: `lib/utils/__tests__/requestDeduplication.test.ts`

**테스트 내용**:
- 동일 요청 중복 제거
- TTL 기반 캐싱
- 에러 시 캐시 제거
- 커스텀 keyGenerator

**실행 예시**:
```bash
npm test requestDeduplication
```

## 테스트 작성 가이드

### 기본 구조

```typescript
import { functionToTest } from '../module'

describe('functionToTest', () => {
  it('should do something', () => {
    const result = functionToTest(input)
    expect(result).toBe(expected)
  })
})
```

### Jest Matchers

```typescript
// 동등성
expect(value).toBe(4)
expect(value).toEqual({ a: 1, b: 2 })

// 숫자
expect(value).toBeGreaterThan(3)
expect(value).toBeCloseTo(0.3, 2)

// 문자열
expect(value).toMatch(/pattern/)
expect(value).toContain('substring')

// 배열/객체
expect(array).toContain(item)
expect(object).toHaveProperty('key')

// 예외
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')
```

### 비동기 테스트

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expected)
})

it('should reject with error', async () => {
  await expect(asyncFunction()).rejects.toThrow('error')
})
```

### 모킹 (Mocking)

```typescript
// 함수 모킹
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))

// 모듈 모킹
jest.mock('../module', () => ({
  functionName: jest.fn(),
}))
```

### 타이머 모킹

```typescript
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

it('should wait for delay', async () => {
  const promise = delayedFunction()
  jest.advanceTimersByTime(1000)
  await promise
})
```

## 커버리지 목표

현재 커버리지 목표:
- **branches**: 70%
- **functions**: 70%
- **lines**: 70%
- **statements**: 70%

## 테스트 작성 우선순위

### 높은 우선순위 (완료 ✅)
- ✅ SRS 알고리즘 (`reviewCard`)
- ✅ 권한 체크 (`permissionChecker`)
- ✅ 재시도 메커니즘 (`retry`)
- ✅ 중복 요청 방지 (`requestDeduplication`)

### 중간 우선순위 (추가 예정)
- ⏳ 배치 저장 (`saveCardStatesBatch`)
- ⏳ 학습 큐 생성 (`getTodayQueues`)
- ⏳ 통계 계산 (`calculateProgressStats`)

### 낮은 우선순위 (추가 예정)
- ⏳ React 컴포넌트 테스트
- ⏳ E2E 테스트
- ⏳ 통합 테스트

## 주의사항

1. **Firebase 모킹**: Firebase 함수는 모킹 필요
2. **타이밍**: `useFakeTimers` 사용 시 주의
3. **비동기**: `async/await` 올바르게 사용
4. **상태 격리**: 각 테스트는 독립적으로 실행

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
