/**
 * 한자 데이터 수집을 위한 헬퍼 스크립트
 * 
 * 사용 방법:
 * 1. Jisho API를 사용하여 한자 정보 가져오기
 * 2. 데이터를 WordData 형식으로 변환
 * 3. 파일에 추가
 */

interface JishoKanjiResult {
  slug: string
  is_common: boolean
  tags: string[]
  jlpt: string[]
  japanese: Array<{
    word: string
    reading: string
  }>
  senses: Array<{
    english_definitions: string[]
    parts_of_speech: string[]
  }>
}

/**
 * Jisho API를 사용하여 한자 정보 가져오기
 */
async function fetchKanjiFromJisho(kanji: string): Promise<JishoKanjiResult | null> {
  try {
    const response = await fetch(`https://jisho.org/api/v1/search/kanji?keyword=${encodeURIComponent(kanji)}`)
    const data = await response.json()
    return data.data?.[0] || null
  } catch (error) {
    console.error(`Error fetching kanji ${kanji}:`, error)
    return null
  }
}

/**
 * WordData 형식으로 변환
 */
function convertToWordData(
  kanji: string,
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
  jishoData: JishoKanjiResult
): {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  kanji: string
  onYomi?: string[]
  kunYomi?: string[]
  radical?: string
  strokeCount?: number
  relatedWords?: Array<{
    word: string
    furigana?: string
    meaning: string
  }>
} {
  // Jisho API에서 제공하는 정보를 기반으로 변환
  // 실제 구현은 Jisho API 응답 구조에 맞게 조정 필요
  
  return {
    level,
    kanji,
    // onYomi, kunYomi는 Jisho API 응답에서 추출
    // radical, strokeCount는 별도로 조회 필요
    relatedWords: jishoData.japanese?.slice(0, 3).map(j => ({
      word: j.word,
      furigana: j.reading,
      meaning: jishoData.senses?.[0]?.english_definitions?.[0] || ''
    }))
  }
}

/**
 * 한자 리스트를 받아서 데이터 수집
 */
export async function collectKanjiData(
  kanjiList: string[],
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
) {
  const results = []
  
  for (const kanji of kanjiList) {
    const jishoData = await fetchKanjiFromJisho(kanji)
    if (jishoData) {
      const wordData = convertToWordData(kanji, level, jishoData)
      results.push(wordData)
    }
    // API 호출 제한을 피하기 위해 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

