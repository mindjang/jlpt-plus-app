# 한자 데이터 수집 가이드

## 데이터 소스 제안

### 1. 공개 API
- **Kanji API**: https://kanjiapi.dev/
- **Jisho API**: https://jisho.org/api/v1/search/kanji
- **Kanjium**: https://github.com/mifunetoshiro/kanjium

### 2. 공개 데이터셋
- **JLPT Kanji Lists**: GitHub에서 공개된 JLPT 한자 리스트
- **JMDict**: 일본어 사전 데이터 (한자 정보 포함)

### 3. 수동 수집
- 각 레벨별 한자 리스트를 찾아서 데이터 입력
- 한자 사전 사이트에서 정보 수집

## 데이터 구조

각 한자는 다음 정보를 포함해야 합니다:
```typescript
{
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
  kanji: string,           // 한자
  onYomi?: string[],       // 음독
  kunYomi?: string[],      // 훈독
  radical?: string,         // 부수
  strokeCount?: number,     // 획수
  relatedWords?: Array<{    // 관련 단어
    word: string,
    furigana?: string,
    meaning: string
  }>
}
```

## 레벨별 한자 수
- N5: 80개
- N4: 169개
- N3: 371개
- N2: 379개
- N1: 1137개
- **총합: 2136개** (상용한자)
- **고유 한자: 약 2610개** (중복 제거 전 또는 추가 한자 포함)

