// 데이터 통합 export
export * from './types'
export * from './levels'
export * from './flashcards'
export * from './kana'
// 단어 및 한자 데이터는 레거시 호환을 위해 words.ts를 통해 export
export * from './words' // 레거시 호환 (내부적으로 words/index와 kanji/index 사용)
// 직접 접근이 필요한 경우:
// import { getWordsByLevel } from '@/data/words/index'
// import { getKanjiByLevel } from '@/data/kanji/index'

