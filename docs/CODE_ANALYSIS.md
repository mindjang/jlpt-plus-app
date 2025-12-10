# 코드 분석 보고서: 긴 파일 및 반복 코드

## 📊 분석 일자
2024년 분석

## 🔍 주요 발견사항

### 1. 매우 긴 데이터 파일들 (정상 - 자동 생성)

다음 파일들은 자동 생성된 데이터 파일로, 코드가 아닌 데이터이므로 리팩토링 대상이 아닙니다:

- `data/kanji/n3.ts` - **80,174줄** (한자 데이터)
- `data/kanji/n2.ts` - **75,416줄** (한자 데이터)
- `data/kanji/n1.ts` - **51,264줄** (한자 데이터)
- `data/kanji/n4.ts` - **36,138줄** (한자 데이터)
- `data/words/n1.ts` - **19,177줄** (단어 데이터)
- `data/words/n2.ts` - **15,668줄** (단어 데이터)
- `data/words/n3.ts` - **11,215줄** (단어 데이터)
- `data/words/n5.ts` - **10,829줄** (단어 데이터)

**권장사항**: 이 파일들은 그대로 유지하되, 필요시 데이터베이스나 별도 JSON 파일로 분리 고려 가능

---

### 2. 반복되는 스크립트 코드 ⚠️

**문제**: `scripts/fetch-n*-kanji-data.ts` 파일들이 거의 동일한 코드를 반복

#### 영향받는 파일들:
- `scripts/fetch-n1-kanji-data.ts` - **2,461줄** (N1만 특별 - 한글 뜻 매핑 포함)
- `scripts/fetch-n2-kanji-data.ts` - ~170줄
- `scripts/fetch-n3-kanji-data.ts` - ~171줄
- `scripts/fetch-n4-kanji-data.ts` - ~150줄
- `scripts/fetch-n5-kanji-data.ts` - ~142줄

#### 반복되는 코드:
1. **`fetchKanjiData` 함수** - API 호출 로직 (5개 파일에 중복)
2. **`filterKanjiAliveEntry` 함수** - 데이터 필터링 로직 (5개 파일에 중복)
3. **`main` 함수** - 메인 실행 로직 (5개 파일에 중복)

#### 리팩토링 제안:

```typescript
// scripts/shared/fetchKanjiHelpers.ts (새 파일 생성)
export async function fetchKanjiData(kanji: string, retryCount = 0): Promise<any | null>
export function filterKanjiAliveEntry(data: any, koreanMeaning?: string): KanjiAliveEntry

// scripts/fetch-kanji-data.ts (통합 스크립트)
// 레벨을 인자로 받아서 처리하는 단일 스크립트로 통합
```

**예상 효과**: 코드 중복 제거, 유지보수성 향상, 버그 수정 시 한 곳만 수정

---

### 3. 중복된 유틸리티 함수 ⚠️

#### `hexToRgba` 함수 (3개 파일에 중복)
- `app/(root)/acquire/auto-study/[level]/page.tsx`
- `app/(mobile)/auto-study/[level]/page.tsx`
- `components/study/StudySession.tsx`

**리팩토링 제안**: `lib/utils/colorUtils.ts`로 추출

#### `SemicircleProgress` 컴포넌트 (2개 파일에 중복)
- `app/(root)/acquire/auto-study/[level]/page.tsx` - Chart.js 사용
- `app/(mobile)/auto-study/[level]/page.tsx` - SVG 직접 구현

**문제**: 같은 목적이지만 구현 방식이 다름 (Chart.js vs SVG)

**리팩토링 제안**: `components/ui/SemicircleProgress.tsx`로 통합 컴포넌트 생성

---

### 4. 중복된 페이지 컴포넌트 ⚠️

#### 검색 페이지 (거의 동일)
- `app/(root)/acquire/search/page.tsx` - 106줄
- `app/(mobile)/search/page.tsx` - 153줄

**차이점**: 
- 모바일 버전에 `handleTabChange` 함수 추가
- 나머지는 거의 동일한 로직

**리팩토링 제안**: 공통 컴포넌트로 추출하거나 레이아웃 차이만 처리

#### 자동 학습 페이지 (유사한 구조)
- `app/(root)/acquire/auto-study/[level]/page.tsx` - 716줄
- `app/(mobile)/auto-study/[level]/page.tsx` - 465줄

**차이점**:
- `SemicircleProgress` 구현 방식 다름
- 일부 UI 차이

**리팩토링 제안**: 공통 로직을 커스텀 훅으로 추출

---

### 5. 긴 컴포넌트 파일

- `app/(root)/acquire/auto-study/[level]/page.tsx` - **716줄**
- `app/(root)/stats/page.tsx` - **588줄**
- `components/study/ExampleCard.tsx` - **507줄**

**권장사항**: 
- 500줄 이상 파일은 작은 컴포넌트로 분리 고려
- 특히 `auto-study/[level]/page.tsx`는 여러 하위 컴포넌트로 분리 가능

---

## 📋 리팩토링 우선순위

### 높은 우선순위 🔴
1. **스크립트 통합** - `fetch-n*-kanji-data.ts` 파일들을 공통 모듈로 통합
2. **유틸리티 함수 추출** - `hexToRgba`를 공통 유틸로 이동
3. **SemicircleProgress 통합** - 두 가지 구현을 하나로 통합

### 중간 우선순위 🟡
4. **검색 페이지 통합** - 공통 컴포넌트로 추출
5. **긴 컴포넌트 분리** - 500줄 이상 파일들을 작은 컴포넌트로 분리

### 낮은 우선순위 🟢
6. **데이터 파일 최적화** - 필요시 데이터베이스나 JSON으로 분리 (현재는 정상)

---

## 💡 구체적인 리팩토링 제안

### 1. 스크립트 통합 예시

```typescript
// scripts/shared/fetchKanjiHelpers.ts
export async function fetchKanjiData(kanji: string, retryCount = 0): Promise<any | null> {
  // 공통 로직
}

export function filterKanjiAliveEntry(data: any, koreanMeaning?: string): KanjiAliveEntry {
  // 공통 로직
}

// scripts/fetch-kanji-data.ts
import { fetchKanjiData, filterKanjiAliveEntry } from './shared/fetchKanjiHelpers'

const LEVELS = {
  n1: { list: N1_KANJI_LIST, meanings: N1_KOREAN_MEANINGS, output: 'n1.ts' },
  n2: { list: N2_KANJI_LIST, output: 'n2.ts' },
  // ...
}

async function main(level: keyof typeof LEVELS) {
  const config = LEVELS[level]
  // 공통 처리 로직
}
```

### 2. 유틸리티 함수 추출

```typescript
// lib/utils/colorUtils.ts
export function hexToRgba(hex: string, alpha: number): string {
  // 구현
}
```

### 3. 컴포넌트 통합

```typescript
// components/ui/SemicircleProgress.tsx
interface SemicircleProgressProps {
  value: number
  progress: number
  total: number
  color: string
  useChart?: boolean // Chart.js 사용 여부
}

export function SemicircleProgress({ useChart = false, ...props }: SemicircleProgressProps) {
  // useChart에 따라 다른 구현 사용
}
```

---

## 📈 예상 효과

- **코드 중복 제거**: ~500줄 이상 감소
- **유지보수성 향상**: 버그 수정 시 한 곳만 수정
- **일관성 향상**: 동일한 기능의 통일된 구현
- **가독성 향상**: 작은 파일들로 분리
