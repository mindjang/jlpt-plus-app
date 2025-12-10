import * as fs from 'fs'
import * as path from 'path'

interface KanjiAliveSearchResult {
  kanji: string
  meaning: string
  onyomi?: string[]
  kunyomi?: string[]
  stroke_count?: number
  radical?: {
    symbol?: string
    meaning?: string
    number?: number
  }
  grade?: number
  jlpt?: number
  decomposition?: string[]
  similar?: string[]
  examples?: Array<{
    japanese: string
    meaning: string
  }>
  frequency?: number
  common?: boolean
  unicode?: string
}

interface KanjiAliveSearchItem {
  kanji: {
    character: string
    stroke: number
  }
  radical: {
    character: string
    stroke: number
    order: number
  }
}

interface KanjiAliveDetailResponse {
  kanji: string
  meaning: string
  onyomi?: string[]
  kunyomi?: string[]
  stroke_count?: number
  radical?: {
    symbol?: string
    meaning?: string
    number?: number
  }
  grade?: number
  jlpt?: number
  decomposition?: string[]
  similar?: string[]
  examples?: Array<{
    japanese: string
    meaning: string
  }>
  frequency?: number
  common?: boolean
  unicode?: string
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '5bacc8bb82msh444081c0b2aa85cp1c6aadjsnbdac63aa4cee'

async function fetchKanjiList(): Promise<string[]> {
  const url = 'https://kanjialive-api.p.rapidapi.com/api/public/search/advanced/?grade=5'
  
  console.log('JLPT N5 한자 목록 가져오는 중...')
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'kanjialive-api.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      console.error(`API 호출 실패: ${response.status}`)
      return []
    }
    
    const data: KanjiAliveSearchItem[] = await response.json()
    
    if (!data || data.length === 0) {
      console.log('결과가 없습니다.')
      return []
    }
    
    const kanjiList = data.map(item => item.kanji.character)
    console.log(`✅ ${kanjiList.length}개 한자 발견: ${kanjiList.join(', ')}`)
    
    return kanjiList
  } catch (error) {
    console.error('오류 발생:', error)
    return []
  }
}

async function fetchKanjiDetail(kanji: string): Promise<KanjiAliveDetailResponse | null> {
  const url = `https://kanjialive.p.rapidapi.com/api/public/kanji/${encodeURIComponent(kanji)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'kanjialive.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      console.error(`  ✗ ${kanji}: API 호출 실패 (${response.status})`)
      return null
    }
    
    const data: KanjiAliveDetailResponse = await response.json()
    return data
  } catch (error) {
    console.error(`  ✗ ${kanji}: 오류 발생`, error)
    return null
  }
}

function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

async function main() {
  // 1. 한자 목록 가져오기
  const kanjiList = await fetchKanjiList()
  
  if (kanjiList.length === 0) {
    console.error('한자 목록을 가져올 수 없습니다.')
    process.exit(1)
  }
  
  console.log(`\n총 ${kanjiList.length}개 한자 처리 시작...\n`)
  
  const kanjiDataArray: any[] = []
  let successCount = 0
  let failCount = 0
  
  // 2. 각 한자에 대해 상세 정보 가져오기
  for (let i = 0; i < kanjiList.length; i++) {
    const kanji = kanjiList[i]
    
    console.log(`[${i + 1}/${kanjiList.length}] ${kanji} 처리 중...`)
    
    const apiData = await fetchKanjiDetail(kanji)
    
    if (!apiData) {
      console.log(`  - API 데이터 없음, 기본 데이터로 생성`)
      failCount++
      
      // 기본 데이터로 생성
      const unicode = kanji.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
      kanjiDataArray.push({
        level: 'N5',
        kanji,
        meaning: [],
        onYomi: [],
        kunYomi: [],
        radical: null,
        radicalMeaning: null,
        radicalNumber: null,
        strokeCount: null,
        strokeOrderSvg: null,
        strokeSteps: [],
        decomposition: [],
        similarKanji: [],
        relatedWords: [],
        examples: [],
        tags: [],
        jlptFrequency: null,
        commonUsage: null,
        unicode
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      continue
    }
    
    // API 데이터로 필드 생성
    const meaning = apiData.meaning 
      ? apiData.meaning.split(',').map(m => m.trim()).filter(m => m)
      : []
    
    const radical = apiData.radical?.symbol || null
    const radicalMeaning = apiData.radical?.meaning || null
    const radicalNumber = apiData.radical?.number || null
    
    const decomposition = apiData.decomposition || []
    const similarKanji = apiData.similar || []
    
    const strokeCount = apiData.stroke_count || null
    const unicode = apiData.unicode || (kanji.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
    
    const jlptFrequency = apiData.frequency || null
    const commonUsage = apiData.common !== undefined ? apiData.common : null
    
    // examples 변환
    const examples = apiData.examples?.map(ex => ({
      sentence: ex.japanese,
      furigana: undefined,
      meaning: ex.meaning,
      level: 'N5' as const
    })) || []
    
    // tags 생성
    const tags: string[] = []
    if (apiData.grade) {
      tags.push(`교육용 ${apiData.grade}학년`)
    }
    if (apiData.jlpt) {
      tags.push(`JLPT N${apiData.jlpt}`)
    }
    
    // onYomi, kunYomi
    const onYomi = apiData.onyomi || []
    const kunYomi = apiData.kunyomi || []
    
    kanjiDataArray.push({
      level: 'N5',
      kanji,
      meaning,
      onYomi,
      kunYomi,
      radical,
      radicalMeaning,
      radicalNumber,
      strokeCount,
      strokeOrderSvg: null,
      strokeSteps: [],
      decomposition,
      similarKanji,
      relatedWords: [],
      examples,
      tags,
      jlptFrequency,
      commonUsage,
      unicode
    })
    
    successCount++
    console.log(`  ✓ 완료`)
    
    // API 호출 제한을 피하기 위해 딜레이
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 3. 파일 생성
  const outputFilePath = path.join(__dirname, '../data/kanji/n5.ts')
  
  const fileContent = `import { WordData } from '../types'

// N5 한자 데이터 (${kanjiDataArray.length}개)
export const n5Kanji: WordData[] = [
${kanjiDataArray.map((data, index) => {
  const lines: string[] = []
  lines.push(`  {`)
  lines.push(`    level: "${data.level}",`)
  lines.push(`    kanji: "${data.kanji}",`)
  lines.push(`    meaning: [${data.meaning.map(m => `"${escapeString(m)}"`).join(', ')}],`)
  lines.push(`    onYomi: ${JSON.stringify(data.onYomi)},`)
  lines.push(`    kunYomi: ${JSON.stringify(data.kunyomi)},`)
  lines.push(`    radical: ${data.radical ? `"${data.radical}"` : 'null'},`)
  lines.push(`    radicalMeaning: ${data.radicalMeaning ? `"${escapeString(data.radicalMeaning)}"` : 'null'},`)
  lines.push(`    radicalNumber: ${data.radicalNumber !== null ? data.radicalNumber : 'null'},`)
  lines.push(`    strokeCount: ${data.strokeCount !== null ? data.strokeCount : 'null'},`)
  lines.push(`    strokeOrderSvg: null,`)
  lines.push(`    strokeSteps: [],`)
  lines.push(`    decomposition: ${JSON.stringify(data.decomposition)},`)
  lines.push(`    similarKanji: ${JSON.stringify(data.similarKanji)},`)
  lines.push(`    relatedWords: [],`)
  
  // examples 포맷팅
  if (data.examples.length > 0) {
    const examplesStr = JSON.stringify(data.examples, null, 6)
      .split('\n')
      .map((line, idx) => idx === 0 ? line : '    ' + line)
      .join('\n')
    lines.push(`    examples: ${examplesStr},`)
  } else {
    lines.push(`    examples: [],`)
  }
  
  lines.push(`    tags: ${JSON.stringify(data.tags)},`)
  lines.push(`    jlptFrequency: ${data.jlptFrequency !== null ? data.jlptFrequency : 'null'},`)
  lines.push(`    commonUsage: ${data.commonUsage !== null ? data.commonUsage : 'null'},`)
  lines.push(`    unicode: "${data.unicode}"`)
  lines.push(`  }`)
  return lines.join('\n')
}).join(',\n')}
]
`
  
  fs.writeFileSync(outputFilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 생성 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   총: ${kanjiDataArray.length}개`)
  console.log(`\n생성된 파일: ${outputFilePath}`)
}

main().catch(console.error)
