import * as fs from 'fs'
import * as path from 'path'

function fixKanjiFile(filePath: string, level: string) {
  console.log(`\n${level} 파일 수정 시작...`)
  
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 1. relatedWords의 level 필드에 쉼표 추가
  content = content.replace(/(meaning:\s*'[^']+')\s+level:\s*"([^"]+)"/g, '$1, level: "$2"')
  
  // 2. examples가 relatedWords 안에 있는 경우 밖으로 이동
  content = content.replace(/(relatedWords:\s*\[[^\]]*\]),\s*examples:\s*\[\]/s, '$1],\n    examples: []')
  
  // 3. examples가 잘못된 위치에 있는 경우 수정
  content = content.replace(/(\]),\s*examples:\s*\[\],\s*unicode:/s, '],\n    examples: [],\n    unicode:')
  
  // 4. 필드 순서 정리 (사용자가 원하는 순서대로)
  // level, kanji, meaning, onYomi, kunYomi, radical, radicalMeaning, radicalNumber, 
  // strokeCount, strokeOrderSvg, strokeSteps, decomposition, similarKanji, 
  // relatedWords, examples, tags, jlptFrequency, commonUsage, unicode
  
  // 각 한자 객체를 찾아서 재정렬
  const kanjiPattern = /\{\s*level:\s*'([^']+)',\s*kanji:\s*'([^']+)',([^}]*?)\}/gs
  const matches: Array<{ fullMatch: string; level: string; kanji: string; rest: string; index: number }> = []
  
  let match
  while ((match = kanjiPattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      level: match[1],
      kanji: match[2],
      rest: match[3],
      index: match.index
    })
  }
  
  console.log(`  ${matches.length}개 한자 발견`)
  
  // 역순으로 변환
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, level: kanjiLevel, kanji: kanjiChar, rest, index } = matches[i]
    
    // 필드 추출
    const meaningMatch = rest.match(/meaning:\s*\[([^\]]*)\]/s)
    const onYomiMatch = rest.match(/onYomi:\s*\[([^\]]*)\]/s)
    const kunYomiMatch = rest.match(/kunYomi:\s*\[([^\]]*)\]/s)
    const radicalMatch = rest.match(/radical:\s*(null|[^,]+)/)
    const radicalMeaningMatch = rest.match(/radicalMeaning:\s*(null|[^,]+)/)
    const radicalNumberMatch = rest.match(/radicalNumber:\s*(null|\d+)/)
    const strokeCountMatch = rest.match(/strokeCount:\s*(\d+)/)
    const strokeOrderSvgMatch = rest.match(/strokeOrderSvg:\s*(null|[^,]+)/)
    const strokeStepsMatch = rest.match(/strokeSteps:\s*\[([^\]]*)\]/s)
    const decompositionMatch = rest.match(/decomposition:\s*\[([^\]]*)\]/s)
    const similarKanjiMatch = rest.match(/similarKanji:\s*\[([^\]]*)\]/s)
    const relatedWordsMatch = rest.match(/relatedWords:\s*\[([^\]]*)\]/s)
    const examplesMatch = rest.match(/examples:\s*\[([^\]]*)\]/s)
    const tagsMatch = rest.match(/tags:\s*\[([^\]]*)\]/s)
    const jlptFrequencyMatch = rest.match(/jlptFrequency:\s*(null|\d+)/)
    const commonUsageMatch = rest.match(/commonUsage:\s*(null|true|false)/)
    const unicodeMatch = rest.match(/unicode:\s*"([^"]+)"/)
    
    // 새 구조로 재구성
    const newObject = `{
    level: "${kanjiLevel}",
    kanji: "${kanjiChar}",
    meaning: ${meaningMatch ? `[${meaningMatch[1]}]` : '[]'},
    onYomi: ${onYomiMatch ? `[${onYomiMatch[1]}]` : '[]'},
    kunYomi: ${kunYomiMatch ? `[${kunYomiMatch[1]}]` : '[]'},
    radical: ${radicalMatch ? radicalMatch[1].trim() : 'null'},
    radicalMeaning: ${radicalMeaningMatch ? radicalMeaningMatch[1].trim() : 'null'},
    radicalNumber: ${radicalNumberMatch ? radicalNumberMatch[1].trim() : 'null'},
    strokeCount: ${strokeCountMatch ? strokeCountMatch[1] : 'null'},
    strokeOrderSvg: ${strokeOrderSvgMatch ? strokeOrderSvgMatch[1].trim() : 'null'},
    strokeSteps: ${strokeStepsMatch ? `[${strokeStepsMatch[1]}]` : '[]'},
    decomposition: ${decompositionMatch ? `[${decompositionMatch[1]}]` : '[]'},
    similarKanji: ${similarKanjiMatch ? `[${similarKanjiMatch[1]}]` : '[]'},
    relatedWords: ${relatedWordsMatch ? `[${relatedWordsMatch[1]}]` : '[]'},
    examples: ${examplesMatch ? `[${examplesMatch[1]}]` : '[]'},
    tags: ${tagsMatch ? `[${tagsMatch[1]}]` : '[]'},
    jlptFrequency: ${jlptFrequencyMatch ? jlptFrequencyMatch[1].trim() : 'null'},
    commonUsage: ${commonUsageMatch ? commonUsageMatch[1].trim() : 'null'},
    unicode: ${unicodeMatch ? `"${unicodeMatch[1]}"` : 'null'}
  }`
    
    // 내용 교체
    const before = content.substring(0, index)
    const after = content.substring(index + fullMatch.length)
    content = before + newObject + after
  }
  
  // 파일 저장
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`${level} 파일 수정 완료!`)
}

async function main() {
  const baseDir = path.join(__dirname, '../data/kanji')
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1']
  
  for (const level of levels) {
    const filePath = path.join(baseDir, `${level}.ts`)
    if (fs.existsSync(filePath)) {
      fixKanjiFile(filePath, level.toUpperCase())
    } else {
      console.log(`${level}.ts 파일을 찾을 수 없습니다.`)
    }
  }
  
  console.log('\n모든 파일 수정 완료!')
}

main().catch(console.error)
