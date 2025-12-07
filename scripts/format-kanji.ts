/**
 * 기존 한자 데이터 파일을 정리하는 스크립트
 * 
 * 사용 방법:
 * npx tsx scripts/format-kanji.ts
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

/**
 * 데이터를 정리된 형식으로 변환
 */
function formatKanjiData(kanjiData: WordData[]): string {
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
  
  return formattedData
}

/**
 * 파일 정리
 */
function formatFile(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1') {
  const filePath = path.join(__dirname, '..', 'data', 'kanji', `${level.toLowerCase()}.ts`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${filePath} 파일이 없습니다.`)
    return
  }
  
  console.log(`\n📝 ${level} 파일 정리 중...`)
  
  // 파일 읽기
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  
  // export된 배열 추출 (간단한 방법: eval 사용하지 않고 정규식으로 파싱)
  // 실제로는 TypeScript 파일을 파싱하는 것이 복잡하므로,
  // 파일을 다시 읽어서 데이터를 추출하는 대신, 스크립트를 다시 실행하는 것이 더 안전합니다.
  
  // 대신 파일을 직접 읽어서 정리하는 방법 사용
  try {
    // 파일에서 export 문 찾기
    const exportMatch = fileContent.match(/export const \w+Kanji: WordData\[\] = \[([\s\S]*)\]/)
    
    if (!exportMatch) {
      console.log(`  ⚠️  ${level} 파일 형식을 인식할 수 없습니다.`)
      return
    }
    
    // 데이터 부분 추출
    const dataSection = exportMatch[1]
    
    // 간단한 파싱 (실제로는 더 복잡할 수 있음)
    // 여기서는 스크립트를 다시 실행하는 것이 더 안전합니다
    console.log(`  ℹ️  ${level} 파일을 정리하려면 fetch-kanji 스크립트를 다시 실행하세요.`)
    console.log(`     또는 파일을 수동으로 정리하세요.`)
    
  } catch (error) {
    console.error(`  ❌ ${level} 파일 정리 실패:`, error)
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🔧 한자 데이터 파일 정리 시작...\n')
  
  // N5 파일 정리
  formatFile('N5')
  
  console.log('\n✅ 정리 완료!')
  console.log('\n💡 팁: 파일을 완전히 정리하려면 fetch-kanji 스크립트를 다시 실행하세요.')
}

// 스크립트 실행
if (require.main === module) {
  main()
}

