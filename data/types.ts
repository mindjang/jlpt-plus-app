// 공통 타입 정의
export type Level = 'N1' | 'N2' | 'N3' | 'N4' | 'N5'

export interface LevelData {
  words: number
  kanji: number
}

export interface LevelGradient {
  from: string
  to: string
}

export interface FlashCardData {
  kanji: string
  furigana?: string
  meaning: string
  example?: string
  exampleMeaning?: string
}

export interface KanaData {
  kana: string
  romaji: string
}


export interface RelatedWord {
  word: string
  furigana?: string
  meaning: string
  meaningEn?: string
  level?: Level
}

// 한자 데이터 구조 (화면에서 사용)
export interface WordData {
  level: Level
  kanji: string
  onYomi?: string[]
  kunYomi?: string[]
  radical?: string | null
  strokeCount?: number
  relatedWords?: RelatedWord[]
  // 추가 필드들 (n2.ts 구조 참고)
  meaning?: string[]
  radicalMeaning?: string | null
  radicalNumber?: number | null
  strokeOrderSvg?: string | null
  strokeSteps?: any[]
  decomposition?: any[]
  similarKanji?: any[]
  examples?: any[]
  tags?: string[]
  jlptFrequency?: number | null
  commonUsage?: string | null
  unicode?: string
}

export interface SearchResult {
  level: Level
  word: string
  furigana?: string
  meaning: string
  sentences?: Array<{
    ja: string
    furigana?: string
    ko: string
  }>
  kanjiDetails?: Array<{
    kanji: string
    meanings: string[]
    onReadings?: string[]
    kunReadings?: string[]
    strokeCount: number
    jlpt?: number | null
  }>
}

// 네이버 히라가나 리스트 항목 (getHiraganaList API 응답)
export interface HiraganaListItem {
  entry_id: string
  parent_entry_id: string
  origin_entry_id: string
  entry: string
  level: string
  source: string
  parts: string[]
  pron: string
  means: string[]
  category1: string
  category2: string
}

// 단어 상세 정보 관련 인터페이스
export interface MeanItem {
  order: string
  value: string
  vcode: string
}

export interface MeansCollectorItem {
  partOfSpeech: string
  partOfSpeech2: string
  partOfSpeechCode: string
  means: MeanItem[]
}

export interface WordItem {
  rank: string
  languageCode: string
  expDictTypeForm: string
  dictTypeForm: string
  priority: number
  expKanji: string
  partGroupYn: string
  newEntry: string
  frequencyAdd: string
  meansCollector: MeansCollectorItem[]
  handleEntry: string
  vcode: string
  encode: string
}

export interface MeaningItem {
  rank: string
  expDictTypeForm: string
  dictTypeForm: string
  expEntry: string
  expEntrySuperscript: string
  priority: number
  meansCollector: MeansCollectorItem[]
  expAliasGeneralAlwaysList: Array<{
    originLanguageValue?: string
  }>
  handleEntry: string
  vcode: string
  encode: string
}

export interface ExampleItem {
  rank: string
  exampleLangCode: string
  example1Lang: number
  expExample1: string
  example2Lang: string
  expExample2: string
  expEntry: string
}

// 단어 상세 정보 (n1_details.ts ~ n5_details.ts)
export interface WordDetails {
  entry: string
  priority: number
  words: WordItem[]
  meaning: MeaningItem[]
  examples: ExampleItem[]
  hiraganaList: HiraganaListItem[]
}


// 예문 오디오 정보
export interface KanjiAliveExampleAudio {
  opus?: string
  aac?: string
  ogg?: string
  mp3?: string
}

// 예문 한 개
export interface KanjiAliveExample {
  japanese: string
  meaning: {
    english: string
    [key: string]: string
  }
  audio?: KanjiAliveExampleAudio
}

// kanji 블록 내부 strokes
export interface KanjiAliveKanjiStrokes {
  count: number
  timings: number[]
  images: string[]
}

export interface KanjiAliveKanjiOnyomi {
  romaji: string
  katakana: string
}

export interface KanjiAliveKanjiKunyomi {
  romaji: string
  hiragana: string
}

export interface KanjiAliveKanjiVideo {
  poster: string
  mp4: string
  webm: string
}

// kanji 블록 전체
export interface KanjiAliveKanjiBlock {
  character: string
  meaning: {
    english: string
    korean?: string
    [key: string]: string | undefined
  }
  strokes: KanjiAliveKanjiStrokes
  onyomi: KanjiAliveKanjiOnyomi
  kunyomi: KanjiAliveKanjiKunyomi
  video: KanjiAliveKanjiVideo
}

// radical 블록
export interface KanjiAliveRadicalPosition {
  hiragana: string
  romaji: string
  icon: string
}

export interface KanjiAliveRadicalName {
  hiragana: string
  romaji: string
}

export interface KanjiAliveRadicalMeaning {
  english: string
  [key: string]: string
}

export interface KanjiAliveRadicalBlock {
  character: string
  strokes: number
  image: string
  position: KanjiAliveRadicalPosition
  name: KanjiAliveRadicalName
  meaning: KanjiAliveRadicalMeaning
  animation: string[]
}

// 🔹 최상위 KanjiAlive 엔트리 (grade만 복구)
export interface KanjiAliveEntry {
  _id: string
  _rev: string

  grade?: number | null            // ← 다시 포함 (교육 레벨)
  hint_group?: number | null

  // 음독/훈독
  onyomi?: string
  onyomi_ja?: string
  kunyomi?: string
  kunyomi_ja?: string
  kunyomi_ka_display?: string

  // 의미
  meaning?: string

  // 획수
  kstroke?: number
  rad_stroke?: number

  // 부수 정보
  rad_utf?: string
  rad_name?: string
  rad_name_ja?: string
  rad_name_file?: string
  rad_order?: number
  rad_position?: string
  rad_position_ja?: string

  // 예문
  examples?: KanjiAliveExample[]

  // stroke timing
  stroketimes?: number[]

  // 기타 코드/ID
  ka_utf: string            // 실제 한자 문자 "一"
  ka_id?: string
  kname?: string
  dick?: string
  dicn?: string

  // 암기 힌트
  mn_hint?: string

  // 복합 객체
  kanji: KanjiAliveKanjiBlock
  radical: KanjiAliveRadicalBlock
}

export interface Word {
  entry_id: string
  origin_entry_id: string
  entry: string
  level: string
  source: string
  partsMeans: Array<{
    part: string | null
    means: string[]
  }>
  category1: string | null
  category2: string | null
  category3: string | null
}