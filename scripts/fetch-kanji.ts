/**
 * JLPT 한자 데이터 수집 스크립트
 * 
 * 단계 1: 각 레벨별 한자 리스트를 동적으로 가져오기
 * 단계 2: 각 한자에 대해 API로 상세 정보 조회 후 저장
 * 
 * 사용 방법:
 * npm run fetch-kanji
 */

import * as fs from 'fs'
import * as path from 'path'

interface WordData {
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
}

interface KanjiAPIResponse {
  kanji: string
  grade?: number
  stroke_count?: number
  meanings?: string[]
  kun_readings?: string[]
  on_readings?: string[]
  name_readings?: string[]
  jlpt?: number
  unicode?: string
  heisig_en?: string
  radical?: {
    name?: string
    meaning?: string
  }
}

/**
 * 단계 1: 각 레벨별 한자 리스트를 동적으로 가져오기
 */
async function fetchKanjiListByLevel(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): Promise<string[]> {
  console.log(`\n📋 [단계 1] ${level} 레벨 한자 리스트 가져오기...`)
  
  try {
    // Kanji API의 JLPT 레벨별 엔드포인트 사용
    const jlptNumber = level === 'N5' ? 5 : level === 'N4' ? 4 : level === 'N3' ? 3 : level === 'N2' ? 2 : 1
    const apiUrl = `https://kanjiapi.dev/v1/kanji/jlpt-${jlptNumber}`
    
    console.log(`  API 호출: ${apiUrl}`)
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API 응답 실패: ${response.status} ${response.statusText}`)
    }
    
    const kanjiList: string[] = await response.json()
    
    if (!Array.isArray(kanjiList)) {
      throw new Error('API 응답이 배열이 아닙니다')
    }
    
    console.log(`  ✅ ${level} 레벨 한자 ${kanjiList.length}개 발견`)
    return kanjiList
    
  } catch (error) {
    console.error(`  ❌ ${level} 레벨 리스트 가져오기 실패:`, error)
    
    // 실패 시 대체 방법: 공개된 JLPT 한자 리스트 사용
    console.log(`  ⚠️  대체 방법: 공개 리스트 사용`)
    return getFallbackKanjiList(level)
  }
}

/**
 * 대체 방법: 공개된 JLPT 한자 리스트 (API 실패 시)
 */
function getFallbackKanjiList(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): string[] {
  // 공개된 JLPT 한자 리스트 (기본값)
  const fallbackLists: Record<string, string[]> = {
    N5: [
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '人', '日', '月', '火', '水', '木', '金', '土', '年', '午',
      '前', '後', '今', '先', '来', '時', '間', '分', '半', '毎',
      '何', '誰', '私', '彼', '子', '女', '男', '父', '母', '友',
      '家', '学', '校', '会', '社', '店', '病', '院', '駅', '車',
      '本', '新', '聞', '手', '紙', '電', '話', '朝', '昼', '夜',
      '見', '聞', '話', '読', '書', '行', '来', '帰', '買', '売',
      '大', '小', '新', '古', '高', '低', '長', '短', '多', '少',
      '上', '下', '中', '外', '左', '右', '東', '西', '南', '北'
    ],
    N4: [
      '学', '生', '国', '語', '話', '読', '書', '聞', '見', '行',
      '来', '帰', '買', '売', '食', '飲', '住', '働', '休', '起',
      '寝', '出', '入', '開', '閉', '始', '終', '続', '止', '動',
      '走', '飛', '泳', '登', '降', '乗', '着', '脱', '洗', '掃'
    ],
    N3: [],
    N2: [],
    N1: []
  }
  
  return fallbackLists[level] || []
}

/**
 * 단계 2: 각 한자에 대해 API로 상세 정보 조회
 */
async function fetchKanjiDetails(kanji: string): Promise<WordData | null> {
  try {
    const response = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.warn(`  ⚠️  ${kanji}: API 응답 실패 (${response.status})`)
      return createBasicKanjiData(kanji)
    }
    
    const data: KanjiAPIResponse = await response.json()
    
    // 음독/훈독 분리
    const onYomi: string[] = []
    const kunYomi: string[] = []
    
    if (data.on_readings) {
      data.on_readings.forEach((reading: string) => {
        if (reading && !onYomi.includes(reading)) {
          onYomi.push(reading)
        }
      })
    }
    
    if (data.kun_readings) {
      data.kun_readings.forEach((reading: string) => {
        if (reading && !kunYomi.includes(reading)) {
          kunYomi.push(reading)
        }
      })
    }
    
    // 관련 단어 생성
    const relatedWords = data.meanings?.slice(0, 3).map((meaning: string) => ({
      word: kanji,
      furigana: onYomi[0] || kunYomi[0] || undefined,
      meaning: meaning || ''
    })) || [{
      word: kanji,
      furigana: onYomi[0] || kunYomi[0] || undefined,
      meaning: data.meanings?.[0] || ''
    }]
    
    return {
      level: 'N5', // 기본값, 나중에 레벨별로 설정
      kanji: kanji,
      onYomi: onYomi.length > 0 ? onYomi : undefined,
      kunYomi: kunYomi.length > 0 ? kunYomi : undefined,
      radical: data.radical?.name || undefined,
      strokeCount: data.stroke_count || undefined,
      relatedWords: relatedWords.length > 0 ? relatedWords : undefined
    }
  } catch (error) {
    console.error(`  ❌ ${kanji}: 오류 발생`, error)
    return createBasicKanjiData(kanji)
  }
}

/**
 * 기본 한자 데이터 생성 (API 실패 시)
 */
function createBasicKanjiData(kanji: string): WordData {
  return {
    level: 'N5',
    kanji: kanji,
    relatedWords: [{
      word: kanji,
      meaning: ''
    }]
  }
}

/**
 * 딜레이 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 한자 리스트를 받아서 데이터 수집
 */
async function collectKanjiData(
  kanjiList: string[],
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
): Promise<WordData[]> {
  const results: WordData[] = []
  
  console.log(`\n📊 [단계 2] ${level} 레벨 한자 상세 정보 수집 시작 (${kanjiList.length}개)`)
  
  for (let i = 0; i < kanjiList.length; i++) {
    const kanji = kanjiList[i]
    console.log(`  [${i + 1}/${kanjiList.length}] ${kanji} 조회 중...`)
    
    const kanjiData = await fetchKanjiDetails(kanji)
    if (kanjiData) {
      kanjiData.level = level
      results.push(kanjiData)
    }
    
    // API 호출 제한을 피하기 위해 딜레이
    if (i < kanjiList.length - 1) {
      await delay(500) // 0.5초 딜레이
    }
  }
  
  console.log(`\n  ✅ ${level} 레벨 수집 완료: ${results.length}개`)
  return results
}

/**
 * 데이터를 파일에 저장
 */
function saveKanjiData(kanjiData: WordData[], level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1') {
  const filePath = path.join(__dirname, '..', 'data', 'kanji', `${level.toLowerCase()}.ts`)
  
  const formattedData = kanjiData.map(item => {
    const lines = [`  {`]
    lines.push(`    level: '${item.level}',`)
    lines.push(`    kanji: '${item.kanji}',`)
    
    if (item.onYomi && item.onYomi.length > 0) {
      lines.push(`    onYomi: [${item.onYomi.map(y => `'${y}'`).join(', ')}],`)
    }
    
    if (item.kunYomi && item.kunYomi.length > 0) {
      lines.push(`    kunYomi: [${item.kunYomi.map(y => `'${y}'`).join(', ')}],`)
    }
    
    if (item.radical) {
      lines.push(`    radical: '${item.radical}',`)
    }
    
    if (item.strokeCount !== undefined) {
      lines.push(`    strokeCount: ${item.strokeCount},`)
    }
    
    if (item.relatedWords && item.relatedWords.length > 0) {
      lines.push(`    relatedWords: [`)
      item.relatedWords.forEach(word => {
        lines.push(`      {`)
        lines.push(`        word: '${word.word}',`)
        if (word.furigana) {
          lines.push(`        furigana: '${word.furigana}',`)
        }
        lines.push(`        meaning: '${word.meaning.replace(/'/g, "\\'")}'`)
        lines.push(`      },`)
      })
      lines.push(`    ],`)
    }
    
    lines.push(`  },`)
    return lines.join('\n')
  }).join('\n')
  
  const fileContent = `import { WordData } from '../types'

// ${level} 한자 데이터 (${kanjiData.length}개)
export const ${level.toLowerCase()}Kanji: WordData[] = [
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
  console.log('🚀 JLPT 한자 데이터 수집 시작...\n')
  
  // N1 수집
  const levels: Array<'N5' | 'N4' | 'N3' | 'N2' | 'N1'> = ['N1']
  
  try {
    for (const level of levels) {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📚 ${level} 레벨 처리 시작`)
      console.log(`${'='.repeat(50)}`)
      
      // 단계 1: 한자 리스트 가져오기
      const kanjiList = await fetchKanjiListByLevel(level)
      
      if (kanjiList.length === 0) {
        console.log(`  ⚠️  ${level} 레벨 한자 리스트가 비어있습니다. 건너뜁니다.`)
        continue
      }
      
      // 단계 2: 각 한자 상세 정보 수집
      const kanjiData = await collectKanjiData(kanjiList, level)
      
      // 단계 3: 파일에 저장
      saveKanjiData(kanjiData, level)
      
      console.log(`\n✅ ${level} 레벨 완료! (${kanjiData.length}개 한자)`)
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log('🎉 N1 레벨 데이터 수집 완료!')
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
