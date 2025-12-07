import { FlashCardData, Level } from './types'

// 레벨별 플래시카드 샘플 데이터
// 실제로는 API나 데이터베이스에서 가져올 데이터
export const flashCardSamples: Record<Level, FlashCardData[]> = {
  N5: [
    {
      kanji: '学',
      furigana: 'がく',
      meaning: '학습, 공부',
      example: '学校に行く',
      exampleMeaning: '학교에 가다',
    },
    {
      kanji: '生',
      furigana: 'せい',
      meaning: '생명, 삶',
      example: '生活が楽しい',
      exampleMeaning: '생활이 즐겁다',
    },
    {
      kanji: '日',
      furigana: 'にち',
      meaning: '날, 일',
      example: '今日はいい天気',
      exampleMeaning: '오늘은 좋은 날씨',
    },
  ],
  N4: [
    {
      kanji: '語',
      furigana: 'ご',
      meaning: '언어, 말',
      example: '日本語を勉強する',
      exampleMeaning: '일본어를 공부하다',
    },
  ],
  N3: [
    {
      kanji: '読',
      furigana: 'よ',
      meaning: '읽다',
      example: '本を読む',
      exampleMeaning: '책을 읽다',
    },
  ],
  N2: [
    {
      kanji: '書',
      furigana: 'か',
      meaning: '쓰다',
      example: '手紙を書く',
      exampleMeaning: '편지를 쓰다',
    },
  ],
  N1: [
    {
      kanji: '難',
      furigana: 'むずか',
      meaning: '어렵다',
      example: '難しい問題',
      exampleMeaning: '어려운 문제',
    },
  ],
}

// 레벨에 맞는 플래시카드 데이터 가져오기
export const getFlashCards = (level: Level): FlashCardData[] => {
  return flashCardSamples[level] || flashCardSamples.N5
}

