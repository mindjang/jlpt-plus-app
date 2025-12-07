/**
 * JSON 파일을 TypeScript 파일로 변환하는 스크립트
 * 
 * data/words/nX.json 파일들을 data/words/nX.ts 파일로 변환합니다.
 * 
 * 사용 방법:
 * npm run json-to-ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface WordEntry {
  word: string
  meaning: string
  furigana?: string
  romaji?: string
  level: number
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
 * JSON 파일 읽기
 */
function readJSONFile(filePath: string): WordEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * TypeScript 파일로 저장
 */
function saveAsTS(filePath: string, data: WordEntry[], level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): void {
  const formattedData = data.map(item => {
    const lines = [`  {`]
    lines.push(`    level: '${level}',`)
    lines.push(`    word: '${escapeString(item.word)}',`)
    
    if (item.furigana) {
      lines.push(`    furigana: '${escapeString(item.furigana)}',`)
    }
    
    lines.push(`    meaning: '${escapeString(item.meaning)}'`)
    
    // kanjiDetails 추가
    if (item.kanjiDetails && item.kanjiDetails.length > 0) {
      lines.push(`,`)
      lines.push(`    kanjiDetails: [`)
      item.kanjiDetails.forEach((detail, idx) => {
        lines.push(`      {`)
        lines.push(`        kanji: '${escapeString(detail.kanji)}',`)
        
        if (detail.meanings && detail.meanings.length > 0) {
          const meaningsStr = detail.meanings.map(m => `'${escapeString(m)}'`).join(', ')
          lines.push(`        meanings: [${meaningsStr}],`)
        }
        
        if (detail.onReadings && detail.onReadings.length > 0) {
          const onReadingsStr = detail.onReadings.map(r => `'${escapeString(r)}'`).join(', ')
          lines.push(`        onReadings: [${onReadingsStr}],`)
        }
        
        if (detail.kunReadings && detail.kunReadings.length > 0) {
          const kunReadingsStr = detail.kunReadings.map(r => `'${escapeString(r)}'`).join(', ')
          lines.push(`        kunReadings: [${kunReadingsStr}],`)
        }
        
        if (detail.strokeCount !== undefined) {
          lines.push(`        strokeCount: ${detail.strokeCount},`)
        }
        
        if (detail.jlpt !== undefined) {
          lines.push(`        jlpt: ${detail.jlpt}`)
        } else {
          // 마지막 줄의 쉼표 제거
          const lastLine = lines[lines.length - 1]
          if (lastLine.endsWith(',')) {
            lines[lines.length - 1] = lastLine.slice(0, -1)
          }
        }
        
        lines.push(`      }${idx < item.kanjiDetails!.length - 1 ? ',' : ''}`)
      })
      lines.push(`    ]`)
    }
    
    lines.push(`  },`)
    return lines.join('\n')
  }).join('\n')
  
  const fileContent = `import { SearchResult } from '../types'

// ${level} 단어 데이터 (${data.length}개)
export const ${level.toLowerCase()}Words: SearchResult[] = [
${formattedData}
]
`
  
  fs.writeFileSync(filePath, fileContent, 'utf-8')
}

/**
 * 문자열 이스케이프 처리
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 JSON 파일을 TypeScript 파일로 변환 시작...\n')
  
  const levels = [
    { json: 'n5', ts: 'n5', level: 'N5' as const },
    { json: 'n4', ts: 'n4', level: 'N4' as const },
    { json: 'n3', ts: 'n3', level: 'N3' as const },
    { json: 'n2', ts: 'n2', level: 'N2' as const },
    { json: 'n1', ts: 'n1', level: 'N1' as const },
  ]
  
  try {
    for (const { json, ts, level } of levels) {
      const jsonPath = path.join(__dirname, '..', 'data', 'words', `${json}.json`)
      const tsPath = path.join(__dirname, '..', 'data', 'words', `${ts}.ts`)
      
      // JSON 파일 존재 확인
      if (!fs.existsSync(jsonPath)) {
        console.log(`  ⚠️  ${json}.json 파일이 없습니다. 건너뜁니다.`)
        continue
      }
      
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📚 ${level} 레벨 변환 시작`)
      console.log(`${'='.repeat(50)}`)
      
      // JSON 파일 읽기
      const words = readJSONFile(jsonPath)
      console.log(`  📖 ${words.length}개 단어 로드 완료`)
      
      // TypeScript 파일로 저장
      saveAsTS(tsPath, words, level)
      console.log(`  💾 ${tsPath}에 저장 완료`)
      console.log(`  ✅ ${level} 레벨 완료!`)
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log('🎉 모든 레벨 변환 완료!')
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

