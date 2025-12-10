import * as fs from 'fs'
import * as path from 'path'

function fixRelatedWords(filePath: string) {
  console.log(`\n${path.basename(filePath)} 파일 수정 중...`)
  
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 1. meaning 다음에 level이 오는 경우 쉼표 추가
  content = content.replace(/(meaning:\s*'[^']+')\s+level:/g, '$1, level:')
  
  // 2. meaningEn, meaning 다음에 level이 오는 경우 쉼표 추가
  content = content.replace(/(meaningEn:\s*'[^']+',\s*meaning:\s*'[^']+')\s+level:/g, '$1, level:')
  
  // 3. 빈 항목 제거 (쉼표만 있는 경우)
  content = content.replace(/,\s*,/g, ',')
  content = content.replace(/\[\s*,/g, '[')
  content = content.replace(/,\s*\]/g, ']')
  
  // 4. level 필드 위치 정리 (meaning 다음에 오도록)
  content = content.replace(/(meaning:\s*'[^']+',?\s*)\n\s+level:/g, '$1 level:')
  
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`  완료!`)
}

async function main() {
  const baseDir = path.join(__dirname, '../data/kanji')
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1']
  
  for (const level of levels) {
    const filePath = path.join(baseDir, `${level}.ts`)
    if (fs.existsSync(filePath)) {
      fixRelatedWords(filePath)
    }
  }
  
  console.log('\n모든 파일 수정 완료!')
}

main().catch(console.error)
