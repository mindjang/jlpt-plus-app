/**
 * 한자 데이터 페칭 공통 유틸리티
 * 모든 fetch-n*-kanji-data.ts 스크립트에서 공통으로 사용
 */
import { KanjiAliveEntry } from '../../data/types'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '5bacc8bb82msh444081c0b2aa85cp1c6aadjsnbdac63aa4cee'

interface KanjiAliveApiResponse {
  _id?: string
  _rev?: string
  ka_utf?: string
  kanji?: any
  radical?: any
  grade?: number | null
  hint_group?: number | null
  onyomi?: string
  onyomi_ja?: string
  kunyomi?: string
  kunyomi_ja?: string
  kunyomi_ka_display?: string
  meaning?: string
  kstroke?: number
  rad_stroke?: number
  rad_utf?: string
  rad_name?: string
  rad_name_ja?: string
  rad_name_file?: string
  rad_order?: number
  rad_position?: string
  rad_position_ja?: string
  examples?: any[]
  stroketimes?: number[]
  ka_id?: string
  kname?: string
  dick?: string
  dicn?: string
  mn_hint?: string
}

/**
 * KanjiAlive API에서 한자 데이터를 가져옴
 * @param kanji 한자 문자
 * @param retryCount 재시도 횟수 (기본 0)
 * @returns API 응답 데이터 또는 null
 */
export async function fetchKanjiData(kanji: string, retryCount = 0): Promise<KanjiAliveApiResponse | null> {
  const url = `https://kanjialive-api.p.rapidapi.com/api/public/kanji/${encodeURIComponent(kanji)}`
  const MAX_RETRIES = 3
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'kanjialive-api.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠ ${kanji}: 데이터를 찾을 수 없습니다`)
        return null
      }
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const waitTime = (retryCount + 1) * 5000 // 5초, 10초, 15초
          console.log(`  ⚠ ${kanji}: API 호출 제한 (429), ${waitTime/1000}초 대기 후 재시도... (${retryCount + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return fetchKanjiData(kanji, retryCount + 1)
        }
        console.log(`  ✗ ${kanji}: API 호출 제한 (429), 재시도 횟수 초과`)
        return null
      }
      console.error(`  ✗ ${kanji}: API 호출 실패 (${response.status})`)
      return null
    }
    
    const data = await response.json()
    return data as KanjiAliveApiResponse
  } catch (error) {
    console.error(`  ✗ ${kanji}: 오류 발생`, error)
    return null
  }
}

/**
 * API 응답 데이터를 KanjiAliveEntry 형식으로 필터링
 * @param data API 응답 데이터
 * @param koreanMeaning 한글 뜻 (선택적, N1 등에서 사용)
 * @returns 필터링된 KanjiAliveEntry
 */
export function filterKanjiAliveEntry(data: KanjiAliveApiResponse, koreanMeaning?: string): KanjiAliveEntry {
  // 인터페이스에 정의된 필드만 추출
  const entry: KanjiAliveEntry = {
    _id: data._id || '',
    _rev: data._rev || '',
    ka_utf: data.ka_utf || '',
    kanji: data.kanji || {
      character: '',
      meaning: { english: '', korean: koreanMeaning || '' },
      strokes: { count: 0, timings: [], images: [] },
      onyomi: { romaji: '', katakana: '' },
      kunyomi: { romaji: '', hiragana: '' },
      video: { poster: '', mp4: '', webm: '' },
    },
    radical: data.radical || {
      character: '',
      strokes: 0,
      image: '',
      position: { hiragana: '', romaji: '', icon: '' },
      name: { hiragana: '', romaji: '' },
      meaning: { english: '' },
      animation: [],
    },
  }
  
  // 선택적 필드들
  if (data.grade !== undefined) entry.grade = data.grade
  if (data.hint_group !== undefined) entry.hint_group = data.hint_group
  if (data.onyomi !== undefined) entry.onyomi = data.onyomi
  if (data.onyomi_ja !== undefined) entry.onyomi_ja = data.onyomi_ja
  if (data.kunyomi !== undefined) entry.kunyomi = data.kunyomi
  if (data.kunyomi_ja !== undefined) entry.kunyomi_ja = data.kunyomi_ja
  if (data.kunyomi_ka_display !== undefined) entry.kunyomi_ka_display = data.kunyomi_ka_display
  if (data.meaning !== undefined) entry.meaning = data.meaning
  if (data.kstroke !== undefined) entry.kstroke = data.kstroke
  if (data.rad_stroke !== undefined) entry.rad_stroke = data.rad_stroke
  if (data.rad_utf !== undefined) entry.rad_utf = data.rad_utf
  if (data.rad_name !== undefined) entry.rad_name = data.rad_name
  if (data.rad_name_ja !== undefined) entry.rad_name_ja = data.rad_name_ja
  if (data.rad_name_file !== undefined) entry.rad_name_file = data.rad_name_file
  if (data.rad_order !== undefined) entry.rad_order = data.rad_order
  if (data.rad_position !== undefined) entry.rad_position = data.rad_position
  if (data.rad_position_ja !== undefined) entry.rad_position_ja = data.rad_position_ja
  if (data.examples !== undefined) entry.examples = data.examples
  if (data.stroketimes !== undefined) entry.stroketimes = data.stroketimes
  if (data.ka_id !== undefined) entry.ka_id = data.ka_id
  if (data.kname !== undefined) entry.kname = data.kname
  if (data.dick !== undefined) entry.dick = data.dick
  if (data.dicn !== undefined) entry.dicn = data.dicn
  if (data.mn_hint !== undefined) entry.mn_hint = data.mn_hint

  // 한글 뜻이 제공된 경우 kanji.meaning.korean에 설정
  if (koreanMeaning && entry.kanji?.meaning) {
    entry.kanji.meaning.korean = koreanMeaning
  }
  
  return entry
}
