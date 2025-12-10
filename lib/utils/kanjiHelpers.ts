/**
 * KanjiAliveEntry에서 화면에 표시할 데이터를 추출하는 헬퍼 함수들
 */
import { KanjiAliveEntry, RelatedWord } from '@/data/types'

/**
 * 한자 문자 추출
 */
export function getKanjiCharacter(entry: KanjiAliveEntry): string {
  return entry.kanji?.character || entry.ka_utf
}

/**
 * 음독 배열 추출
 */
export function getOnYomi(entry: KanjiAliveEntry): string[] {
  const onyomi = entry.kanji?.onyomi?.katakana || entry.onyomi_ja || ''
  if (!onyomi) return []
  return onyomi.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * 훈독 배열 추출
 */
export function getKunYomi(entry: KanjiAliveEntry): string[] {
  const kunyomi = entry.kanji?.kunyomi?.hiragana || entry.kunyomi_ja || ''
  if (!kunyomi) return []
  return kunyomi.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * 의미 추출 (한국어 우선)
 */
export function getKanjiMeaning(entry: KanjiAliveEntry): string {
  return entry.kanji?.meaning?.korean || 
         entry.kanji?.meaning?.english || 
         entry.meaning || 
         ''
}

/**
 * 부수 문자 추출
 */
export function getRadical(entry: KanjiAliveEntry): string | null {
  return entry.radical?.character || entry.rad_utf || null
}

/**
 * 획수 추출
 */
export function getStrokeCount(entry: KanjiAliveEntry): number | undefined {
  return entry.kanji?.strokes?.count || entry.kstroke
}

/**
 * 예문을 RelatedWord 형식으로 변환
 */
export function getRelatedWords(entry: KanjiAliveEntry, level: string): RelatedWord[] {
  if (!entry.examples) return []
  
  return entry.examples.map((example) => {
    // "人類学（じんるいがく）" 형식에서 한자와 후리가나 분리
    const japanese = example.japanese
    const furiganaMatch = japanese.match(/（([^）]+)）/)
    const furigana = furiganaMatch ? furiganaMatch[1] : undefined
    const word = japanese.replace(/（[^）]+）/g, '').trim()
    
    return {
      word,
      furigana,
      meaning: example.meaning.korean || example.meaning.english,
      meaningEn: example.meaning.english,
      level: level as any,
    }
  })
}

/**
 * 첫 번째 의미 (간단한 표시용)
 */
export function getFirstMeaning(entry: KanjiAliveEntry): string {
  const meaning = getKanjiMeaning(entry)
  if (meaning) return meaning
  
  // 예문의 첫 번째 의미 사용
  if (entry.examples && entry.examples.length > 0) {
    return entry.examples[0].meaning.korean || entry.examples[0].meaning.english || ''
  }
  
  return ''
}
