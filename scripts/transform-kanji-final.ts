import * as fs from 'fs'
import * as path from 'path'

function getUnicode(kanji: string): string {
  if (kanji.length === 0) return ''
  return kanji.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
}

function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function extractRelatedWords(content: string, level: string): string {
  // relatedWords 배열 추출
  const relatedWordsMatch = content.match(/relatedWords:\s*\[([^\]]*)\]/s)
  if (!relatedWordsMatch) {
    return 'relatedWords: []'
  }
  
  const wordsContent = relatedWordsMatch[1].trim()
  if (!wordsContent) {
    return 'relatedWords: []'
  }
  
  // 각 단어 객체 추출 및 level 추가
  const words: string[] = []
  let braceCount = 0
  let currentWord = ''
  let inString = false
  let stringChar = ''
  
  for (let i = 0; i < wordsContent.length; i++) {
    const char = wordsContent[i]
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
      currentWord += char
    } else if (inString && char === stringChar && wordsContent[i - 1] !== '\\') {
      inString = false
      currentWord += char
    } else {
      currentWord += char
      
      if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            // 단어 객체 완성
            let wordObj = currentWord.trim()
            // level 필드가 없으면 추가
            if (!wordObj.includes('level:')) {
              // meaning 다음에 level 추가
              wordObj = wordObj.replace(/(meaning:\s*'[^']+',?\s*)/, `$1level: "${level}", `)
              // 또는 word 다음에 level 추가
              if (!wordObj.includes('level:')) {
                wordObj = wordObj.replace(/(word:\s*'[^']+',?\s*)/, `$1level: "${level}", `)
              }
            }
            words.push(wordObj)
            currentWord = ''
          }
        }
      }
    }
  }
  
  if (words.length === 0) {
    return 'relatedWords: []'
  }
  
  return `relatedWords: [\n      ${words.join(',\n      ')}\n    ]`
}

function transformKanjiFile(filePath: string, level: string) {
  console.log(`\n${level} 파일 변환 시작...`)
  
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 각 한자 객체 찾기
  const kanjiObjects: Array<{ start: number; end: number; content: string }> = []
  
  let pos = 0
  while (pos < content.length) {
    const kanjiMatch = content.substring(pos).match(/\{\s*level:\s*'[^']+',\s*kanji:\s*'([^']+)',/)
    if (!kanjiMatch) break
    
    const objStart = pos + kanjiMatch.index!
    const kanji = kanjiMatch[1]
    
    // 객체의 끝 찾기 (중괄호 매칭)
    let braceCount = 0
    let inString = false
    let stringChar = ''
    let objEnd = objStart
    
    for (let i = objStart; i < content.length; i++) {
      const char = content[i]
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && content[i - 1] !== '\\') {
        inString = false
      } else if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            objEnd = i + 1
            break
          }
        }
      }
    }
    
    const objContent = content.substring(objStart, objEnd)
    kanjiObjects.push({ start: objStart, end: objEnd, content: objContent })
    
    pos = objEnd
  }
  
  console.log(`  ${kanjiObjects.length}개 한자 발견`)
  
  // 역순으로 변환
  for (let i = kanjiObjects.length - 1; i >= 0; i--) {
    const { start, end, content: objContent } = kanjiObjects[i]
    
    // 필드 추출
    const levelMatch = objContent.match(/level:\s*'([^']+)'/)
    const kanjiMatch = objContent.match(/kanji:\s*'([^']+)'/)
    const onYomiMatch = objContent.match(/onYomi:\s*\[([^\]]*)\]/s)
    const kunYomiMatch = objContent.match(/kunYomi:\s*\[([^\]]*)\]/s)
    const strokeCountMatch = objContent.match(/strokeCount:\s*(\d+)/)
    
    if (!levelMatch || !kanjiMatch) continue
    
    const kanjiLevel = levelMatch[1]
    const kanji = kanjiMatch[1]
    
    // meaning 추출 (relatedWords에서)
    const meanings: string[] = []
    const relatedWordsMatch = objContent.match(/relatedWords:\s*\[([^\]]*)\]/s)
    if (relatedWordsMatch) {
      const wordsContent = relatedWordsMatch[1]
      const wordMeanings = wordsContent.match(/meaning:\s*'([^']+)'/g)
      if (wordMeanings) {
        wordMeanings.forEach(m => {
          const meaning = m.match(/'([^']+)'/)?.[1]
          if (meaning && !meanings.includes(meaning)) {
            meanings.push(meaning)
          }
        })
      }
    }
    
    // relatedWords 재구성
    const relatedWordsStr = extractRelatedWords(objContent, level)
    
    // 새 구조로 재구성
    const newObject = `{
    level: "${kanjiLevel}",
    kanji: "${kanji}",
    meaning: [${meanings.map(m => `"${escapeString(m)}"`).join(', ')}],
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
    unicode: "${getUnicode(kanji)}"
  }`
    
    // 내용 교체
    content = content.substring(0, start) + newObject + content.substring(end)
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
