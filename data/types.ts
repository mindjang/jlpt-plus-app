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

export interface WordData {
  level: Level
  kanji: string
  onYomi?: string[]
  kunYomi?: string[]
  radical?: string
  strokeCount?: number
  relatedWords?: RelatedWord[]
}

export interface RelatedWord {
  word: string
  furigana?: string
  meaning: string
}

export interface SearchResult {
  level: Level
  word: string
  furigana?: string
  meaning: string
  kanjiDetails?: Array<{
    kanji: string
    meanings: string[]
    onReadings?: string[]
    kunReadings?: string[]
    strokeCount: number
    jlpt?: number | null
  }>
}

