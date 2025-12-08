// 콘텐츠 타입 정의 (명세에 맞게)
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export interface Word {
  id: string // 예: "N5_W_0001"
  level: JlptLevel // "N5"
  chapter: number // 챕터 번호 (1,2,3..)
  kana: string // たてもの
  kanji?: string // 建物 (가나만 있는 단어는 undefined)
  romaji?: string // tate mono (옵션)

  meaningKo: string // "건물"
  meaningEn?: string

  examples?: {
    ja: string
    jaFurigana?: string
    ko: string
  }[]

  tags?: string[] // ["일상", "장소"] 등
}

export interface Kanji {
  id: string // 예: "N5_K_0001"
  level: JlptLevel
  character: string // "難"
  strokeCount: number
  onyomi: string[] // ["なん"]
  kunyomi: string[] // ["むずかしい"]

  meaningKo: string // "어려울 난"
  meaningEn?: string

  radical?: string
  radicalNameKo?: string
  components?: string[]

  exampleWordIds?: string[] // 이 한자가 포함된 단어 id 목록
}

