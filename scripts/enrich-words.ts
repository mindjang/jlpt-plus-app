/**
 * 단어 데이터에 상세 정보 추가 스크립트
 * 
 * KanjiAPI를 사용하여 단어에 포함된 한자의 상세 정보를 추가합니다.
 * 
 * 사용 방법:
 * npm run enrich-words
 */

import * as fs from 'fs'
import * as path from 'path'

interface WordEntry {
  word: string
  meaning: string
  furigana?: string
  romaji?: string
  level: number
}

interface KanjiAPIResponse {
  kanji: string
  grade?: number
  stroke_count: number
  meanings: string[]
  kun_readings: string[]
  on_readings: string[]
  name_readings?: string[]
  jlpt?: number
  unicode: string
  heisig_en?: string
}

interface EnrichedWordEntry extends WordEntry {
  kanjiDetails?: Array<{
    kanji: string
    meanings: string[]
    onReadings: string[]
    kunReadings: string[]
    strokeCount: number
    jlpt?: number
  }>
}

/**
 * 딜레이 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 단어에서 한자 추출
 */
function extractKanji(word: string): string[] {
  // 한자(한자 범위: \u4e00-\u9faf)만 추출
  const kanjiRegex = /[\u4e00-\u9faf]/g
  const matches = word.match(kanjiRegex)
  return matches ? [...new Set(matches)] : [] // 중복 제거
}

/**
 * KanjiAPI에서 한자 상세 정보 가져오기
 */
async function fetchKanjiDetails(kanji: string): Promise<KanjiAPIResponse | null> {
  try {
    const response = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data: KanjiAPIResponse = await response.json()
    return data
    
  } catch (error) {
    console.error(`  ❌ ${kanji}: 오류 발생`, error)
    return null
  }
}

/**
 * 단어 데이터에 한자 상세 정보 추가
 */
async function enrichWord(wordEntry: WordEntry): Promise<EnrichedWordEntry> {
  const enriched: EnrichedWordEntry = { ...wordEntry }
  
  // 단어에서 한자 추출
  const kanjiList = extractKanji(wordEntry.word)
  
  if (kanjiList.length === 0) {
    // 한자가 없는 경우 (히라가나, 가타카나만 있는 경우)
    return enriched
  }
  
  // 각 한자에 대해 상세 정보 조회
  const kanjiDetails = []
  
  for (const kanji of kanjiList) {
    const details = await fetchKanjiDetails(kanji)
    
    if (details) {
      kanjiDetails.push({
        kanji: details.kanji,
        meanings: details.meanings || [],
        onReadings: details.on_readings || [],
        kunReadings: details.kun_readings || [],
        strokeCount: details.stroke_count,
        jlpt: details.jlpt
      })
    }
    
    // API 호출 제한을 피하기 위해 딜레이
    await delay(500) // 0.5초 딜레이
  }
  
  if (kanjiDetails.length > 0) {
    enriched.kanjiDetails = kanjiDetails
  }
  
  return enriched
}

/**
 * JSON 파일 읽기
 */
function readWordFile(filePath: string): WordEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * JSON 파일 저장
 */
function saveWordFile(filePath: string, data: EnrichedWordEntry[]): void {
  const content = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, content, 'utf-8')
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 단어 데이터 상세 정보 추가 시작...\n')
  
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1']
  
  try {
    for (const level of levels) {
      const filePath = path.join(__dirname, '..', 'data', 'words', `${level}.json`)
      
      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  ${level}.json 파일이 없습니다. 건너뜁니다.`)
        continue
      }
      
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📚 ${level.toUpperCase()} 레벨 처리 시작`)
      console.log(`${'='.repeat(50)}`)
      
      // 파일 읽기
      const words = readWordFile(filePath)
      console.log(`  📖 ${words.length}개 단어 로드 완료`)
      
      // 각 단어에 상세 정보 추가
      const enrichedWords: EnrichedWordEntry[] = []
      
       for (let i = 0; i < words.length; i++) {
         const word = words[i]
         process.stdout.write(`  진행 중... [${i + 1}/${words.length}] ${word.word}\r`)
         
         const enriched = await enrichWord(word)
         enrichedWords.push(enriched)
         
         // API 호출 제한을 피하기 위해 단어 간 딜레이
         if (i < words.length - 1) {
           await delay(100) // 단어 간 딜레이
         }
       }
      
      process.stdout.write('\n') // Clear the line
      
      // 파일 저장
      saveWordFile(filePath, enrichedWords)
      console.log(`\n  💾 ${filePath}에 저장 완료`)
      console.log(`  ✅ ${level.toUpperCase()} 레벨 완료!`)
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log('🎉 모든 레벨 데이터 상세 정보 추가 완료!')
    console.log(`${'='.repeat(50)}`)
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
}

