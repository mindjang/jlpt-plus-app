import * as fs from 'fs'
import * as path from 'path'

function getUnicode(kanji: string): string {
  if (kanji.length === 0) return ''
  return kanji.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
}

function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function transformKanjiFile(filePath: string, level: string) {
  console.log(`\n${level} 파일 변환 시작...`)
  
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 각 한자 객체를 찾아서 완전히 재구성
  const kanjiRegex = /\{\s*level:\s*'([^']+)',\s*kanji:\s*'([^']+)',([^}]*?)\}/gs
  const matches: Array<{ fullMatch: string; level: string; kanji: string; rest: string; index: number }> = []
  
  let match
  while ((match = kanjiRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      level: match[1],
      kanji: match[2],
      rest: match[3],
      index: match.index
    })
  }
  
  console.log(`  ${matches.length}개 한자 발견`)
  
  // 역순으로 변환 (인덱스가 변경되지 않도록)
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, kanji: kanjiChar, rest, index } = matches[i]
    
    // 기존 필드 추출
    const onYomiMatch = rest.match(/onYomi:\s*\[([^\]]*)\]/s)
    const kunYomiMatch = rest.match(/kunYomi:\s*\[([^\]]*)\]/s)
    const strokeCountMatch = rest.match(/strokeCount:\s*(\d+)/)
    const relatedWordsMatch = rest.match(/relatedWords:\s*\[([^\]]*)\]/s)
    
    // meaning 추출 (relatedWords에서)
    const meanings: string[] = []
    if (relatedWordsMatch) {
      const relatedWordsContent = relatedWordsMatch[1]
      const wordMeanings = relatedWordsContent.match(/meaning:\s*'([^']+)'/g)
      if (wordMeanings) {
        wordMeanings.forEach(m => {
          const meaning = m.match(/'([^']+)'/)?.[1]
          if (meaning && !meanings.includes(meaning)) {
            meanings.push(meaning)
          }
        })
      }
    }
    
    // relatedWords 재구성 (level 추가)
    let relatedWordsStr = 'relatedWords: []'
    if (relatedWordsMatch) {
      const wordsContent = relatedWordsMatch[1]
      const words: string[] = []
      const wordRegex = /\{([^}]+)\}/g
      let wordMatch
      while ((wordMatch = wordRegex.exec(wordsContent)) !== null) {
        let wordObj = wordMatch[1]
        // level 필드가 없으면 추가
        if (!wordObj.includes('level:')) {
          // meaning 다음에 level 추가
          wordObj = wordObj.replace(/(meaning:\s*'[^']+',?\s*)/, `$1level: "${level}", `)
        }
        words.push(`{ ${wordObj} }`)
      }
      if (words.length > 0) {
        relatedWordsStr = `relatedWords: [\n      ${words.join(',\n      ')}\n    ]`
      }
    }
    
    // 새 구조로 재구성 (사용자가 원하는 순서대로)
    const newObject = `{
    level: "${level}",
    kanji: "${kanjiChar}",
    meaning: [${meanings.length > 0 ? meanings.map(m => `"${escapeString(m)}"`).join(', ') : ''}],
    onYomi: ${onYomiMatch ? `[${onYomiMatch[1]}]` : '[]'},
    kunYomi: ${kunYomiMatch ? `[${kunYomiMatch[1]}]` : '[]'},
    radical: null,
    radicalMeaning: null,
    radicalNumber: null,
    strokeCount: ${strokeCountMatch ? strokeCountMatch[1] : 'null'},
    strokeOrderSvg: null,
    strokeSteps: [],
    decomposition: [],
    similarKanji: [],
    ${relatedWordsStr},
    examples: [],
    tags: [],
    jlptFrequency: null,
    commonUsage: null,
    unicode: "${getUnicode(kanjiChar)}"
  }`
    
    // 내용 교체
    const before = content.substring(0, index)
    const after = content.substring(index + fullMatch.length)
    content = before + newObject + after
  }
  
  // 파일 저장
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`${level} 파일 변환 완료!`)
}

async function main() {
  const baseDir = path.join(__dirname, '../data/kanji')
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1']
  
  for (const level of levels) {
    const filePath = path.join(baseDir, `${level}.ts`)
    if (fs.existsSync(filePath)) {
      transformKanjiFile(filePath, level.toUpperCase())
    } else {
      console.log(`${level}.ts 파일을 찾을 수 없습니다.`)
    }
  }
  
  console.log('\n모든 파일 변환 완료!')
}

main().catch(console.error)
