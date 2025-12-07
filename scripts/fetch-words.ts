/**
 * JLPT 단어 데이터 수집 스크립트
 * 
 * 네이버 일본어 사전 API 사용:
 * https://ja.dict.naver.com/api/jako/getJLPTList
 * 
 * 사용 방법:
 * npm run fetch-words
 */

import * as fs from 'fs'
import * as path from 'path'

interface SearchResult {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  word: string
  furigana?: string
  meaning: string
}

interface NaverJLPTResponse {
  m_total: number
  m_page: number
  m_pageSize: number
  m_start: number
  m_end: number
  m_totalPage: number
  m_items: Array<{
    entry: string
    show_entry: string
    pron?: string
    means: string[]
    level: string
  }>
}

/**
 * 딜레이 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 네이버 일본어 사전 API에서 JLPT 단어 리스트 가져오기
 */
async function fetchFromNaverAPI(
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
  page: number = 1
): Promise<NaverJLPTResponse | null> {
  try {
    // 레벨을 숫자로 변환 (N5 -> 5, N4 -> 4, ...)
    const levelNum = level === 'N5' ? 5 : level === 'N4' ? 4 : level === 'N3' ? 3 : level === 'N2' ? 2 : 1
    
    // part=%EC%A0%84%EC%B2%B4 는 "전체"를 의미 (URL 인코딩)
    const url = `https://ja.dict.naver.com/api/jako/getJLPTList?level=${levelNum}&part=%EC%A0%84%EC%B2%B4&page=${page}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.warn(`  ⚠️  페이지 ${page} API 응답 실패 (${response.status})`)
      return null
    }
    
    const data: NaverJLPTResponse = await response.json()
    return data
    
  } catch (error) {
    console.error(`  ❌ 페이지 ${page} 오류 발생:`, error)
    return null
  }
}

/**
 * 단계 1: 각 레벨별 단어 리스트를 동적으로 가져오기 (모든 페이지)
 */
async function fetchWordListByLevel(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): Promise<Array<{word: string, furigana?: string, meaning?: string}>> {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`📚 ${level} 레벨 단어 리스트 가져오기`)
  console.log(`${'='.repeat(50)}`)
  
  // 첫 페이지를 가져와서 전체 페이지 수 확인
  console.log(`\n📋 [단계 1] 첫 페이지 조회 중...`)
  const firstPage = await fetchFromNaverAPI(level, 1)
  
  if (!firstPage || !firstPage.m_items || firstPage.m_items.length === 0) {
    console.log(`  ❌ ${level} 레벨 데이터를 가져올 수 없습니다.`)
    return []
  }
  
  const totalPages = firstPage.m_totalPage
  const totalWords = firstPage.m_total
  
  console.log(`  ✅ 전체 ${totalWords}개 단어, ${totalPages}페이지 발견`)
  console.log(`\n📊 [단계 2] 모든 페이지 수집 시작...`)
  
  const allWords: Array<{word: string, furigana?: string, meaning?: string}> = []
  
  // 첫 페이지 데이터 추가
  firstPage.m_items.forEach(item => {
    allWords.push({
      word: item.entry || item.show_entry || '',
      furigana: item.pron || undefined,
      meaning: item.means && item.means.length > 0 ? item.means.join(', ') : ''
    })
  })
  
  // 나머지 페이지 수집
  for (let page = 2; page <= totalPages; page++) {
    process.stdout.write(`  진행 중... [${page}/${totalPages}] 페이지\r`)
    
    const pageData = await fetchFromNaverAPI(level, page)
    
    if (pageData && pageData.m_items) {
      pageData.m_items.forEach(item => {
        allWords.push({
          word: item.entry || item.show_entry || '',
          furigana: item.pron || undefined,
          meaning: item.means && item.means.length > 0 ? item.means.join(', ') : ''
        })
      })
    }
    
    // API 호출 제한을 피하기 위해 딜레이
    if (page < totalPages) {
      await delay(300) // 0.3초 딜레이
    }
  }
  
  process.stdout.write('\n') // Clear the line
  console.log(`\n  ✅ ${level} 레벨 단어 ${allWords.length}개 수집 완료!`)
  
  return allWords
}

/**
 * 단어 리스트를 받아서 데이터 수집
 */
async function collectWordData(
  wordList: Array<{word: string, furigana?: string, meaning?: string}>,
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  console.log(`\n📊 [단계 3] ${level} 레벨 단어 데이터 처리 시작 (${wordList.length}개)`)
  
  // 네이버 API에서 이미 모든 데이터를 가져왔으므로 바로 변환
  wordList.forEach(item => {
    if (item.word && item.meaning) {
      results.push({
        level,
        word: item.word,
        furigana: item.furigana,
        meaning: item.meaning
      })
    }
  })
  
  console.log(`\n  ✅ ${level} 레벨 수집 완료: ${results.length}개`)
  return results
}

/**
 * 데이터를 파일에 저장
 */
function saveWordData(wordData: SearchResult[], level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1') {
  const filePath = path.join(__dirname, '..', 'data', 'words', `${level.toLowerCase()}.ts`)
  
  const formattedData = wordData.map(item => {
    const lines = [`  {`]
    lines.push(`    level: '${item.level}',`)
    lines.push(`    word: '${item.word.replace(/'/g, "\\'")}',`)
    
    if (item.furigana) {
      lines.push(`    furigana: '${item.furigana.replace(/'/g, "\\'")}',`)
    }
    
    lines.push(`    meaning: '${item.meaning.replace(/'/g, "\\'")}'`)
    
    lines.push(`  },`)
    return lines.join('\n')
  }).join('\n')
  
  const fileContent = `import { SearchResult } from '../types'

// ${level} 단어 데이터 (${wordData.length}개)
export const ${level.toLowerCase()}Words: SearchResult[] = [
${formattedData}
]
`
  
  fs.writeFileSync(filePath, fileContent, 'utf-8')
  console.log(`\n  💾 ${filePath}에 저장 완료`)
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 JLPT 단어 데이터 수집 시작...')
  console.log('📡 네이버 일본어 사전 API 사용\n')
  
  // 모든 레벨 수집 (N3, N2, N1)
  const levels: Array<'N5' | 'N4' | 'N3' | 'N2' | 'N1'> = ['N3', 'N2', 'N1']
  
  try {
    for (const level of levels) {
      // 단계 1: 단어 리스트 가져오기 (모든 페이지)
      const wordList = await fetchWordListByLevel(level)
      
      if (wordList.length === 0) {
        console.log(`\n  ⚠️  ${level} 레벨 단어 리스트가 비어있습니다. 건너뜁니다.`)
        continue
      }
      
      // 단계 2: 각 단어 상세 정보 수집
      const wordData = await collectWordData(wordList, level)
      
      // 단계 3: 파일에 저장
      saveWordData(wordData, level)
      
      console.log(`\n✅ ${level} 레벨 완료! (${wordData.length}개 단어)`)
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log('🎉 데이터 수집 완료!')
    console.log(`${'='.repeat(50)}`)
    console.log('\n다음 레벨을 수집하려면 스크립트의 levels 배열에 추가하세요.')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
}
