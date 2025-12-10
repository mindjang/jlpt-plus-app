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
  const originalContent = content
  
  // 각 한자 객체의 시작과 끝을 찾기
  // 패턴: { level: 'N5', kanji: '一', ... }
  const kanjiObjects: Array<{ start: number; end: number; kanji: string; fullText: string }> = []
  
  let pos = 0
  while (pos < content.length) {
    const kanjiMatch = content.substring(pos).match(/\{\s*level:\s*'[^']+',\s*kanji:\s*'([^']+)',/)
    if (!kanjiMatch) break
    
    const kanjiStart = pos + kanjiMatch.index!
    const kanji = kanjiMatch[1]
    
    // 해당 객체의 끝 찾기 (중괄호 매칭)
    let braceCount = 0
    let inString = false
    let stringChar = ''
    let kanjiEnd = kanjiStart
    
    for (let i = kanjiStart; i < content.length; i++) {
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
            kanjiEnd = i + 1
            break
          }
        }
      }
    }
    
    const fullText = content.substring(kanjiStart, kanjiEnd)
    kanjiObjects.push({ start: kanjiStart, end: kanjiEnd, kanji, fullText })
    
    pos = kanjiEnd
  }
  
  console.log(`  ${kanjiObjects.length}개 한자 발견`)
  
  // 역순으로 변환 (인덱스가 변경되지 않도록)
  for (let i = kanjiObjects.length - 1; i >= 0; i--) {
    const { start, end, kanji: kanjiChar, fullText } = kanjiObjects[i]
    
    // 이미 새 구조로 변환된 경우 스킵
    if (fullText.includes('meaning: [') || fullText.includes('meaning:[')) {
      continue
    }
    
    let transformed = fullText
    
    // 1. meaning 배열 생성 (relatedWords의 meaning을 기반으로)
    const meanings: string[] = []
    const meaningMatches = fullText.match(/meaning:\s*'([^']+)'/g)
    if (meaningMatches) {
      meaningMatches.forEach(m => {
        const meaning = m.match(/'([^']+)'/)?.[1]
        if (meaning && !meanings.includes(meaning)) {
          meanings.push(meaning)
        }
      })
    }
    
    // relatedWords에서 meaning 추출
    const relatedWordsMatch = fullText.match(/relatedWords:\s*\[([^\]]*)\]/s)
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
    
    // meaning 필드 추가 (kanji 다음에)
    const meaningStr = meanings.length > 0
      ? `meaning: [${meanings.map(m => `"${escapeString(m)}"`).join(', ')}],\n    `
      : `meaning: [],\n    `
    transformed = transformed.replace(/(kanji:\s*'[^']+',\s*)/, `$1${meaningStr}`)
    
    // 2. radical 필드 추가
    if (!transformed.includes('radical:')) {
      const radicalStr = `radical: null,\n    radicalMeaning: null,\n    radicalNumber: null,\n    `
      transformed = transformed.replace(/(meaning:\s*\[[^\]]*\],\s*)/, `$1${radicalStr}`)
    }
    
    // 3. decomposition, similarKanji 추가
    if (!transformed.includes('decomposition:')) {
      const decompositionStr = `decomposition: [],\n    similarKanji: [],\n    `
      transformed = transformed.replace(/(radicalNumber:\s*null,\s*)/, `$1${decompositionStr}`)
    }
    
    // 4. strokeOrderSvg, strokeSteps 추가 (strokeCount 다음에)
    if (!transformed.includes('strokeOrderSvg:')) {
      const strokeStr = `strokeOrderSvg: null,\n    strokeSteps: [],\n    `
      transformed = transformed.replace(/(strokeCount:\s*\d+,\s*)/, `$1${strokeStr}`)
    }
    
    // 5. relatedWords에 level 필드 추가
    if (transformed.includes('relatedWords:')) {
      transformed = transformed.replace(
        /(relatedWords:\s*\[)([^\]]*)(\])/s,
        (match, prefix, wordsContent, suffix) => {
          // 각 relatedWord 객체에 level 추가
          const updatedContent = wordsContent.replace(
            /(\{[^}]*?)(\})/g,
            (wordMatch: string, wordContent: string) => {
              if (!wordContent.includes('level:')) {
                // meaning 다음에 level 추가
                if (wordContent.includes('meaning:')) {
                  return wordContent.replace(/(meaning:\s*'[^']+',?\s*)/, `$1level: "${level}",\n      `) + '}'
                }
                // word 다음에 level 추가
                return wordContent.replace(/(word:\s*'[^']+',?\s*)/, `$1level: "${level}",\n      `) + '}'
              }
              return wordMatch
            }
          )
          return prefix + updatedContent + suffix
        }
      )
    }
    
    // 6. examples 추가
    if (!transformed.includes('examples:')) {
      const examplesStr = `examples: [],\n    `
      if (transformed.includes('relatedWords:')) {
        transformed = transformed.replace(/(relatedWords:\s*\[[^\]]*\],\s*)/s, `$1${examplesStr}`)
      } else if (transformed.includes('strokeSteps:')) {
        transformed = transformed.replace(/(strokeSteps:\s*\[\],\s*)/, `$1${examplesStr}`)
      }
    }
    
    // 7. unicode 추가
    if (!transformed.includes('unicode:')) {
      const unicode = getUnicode(kanjiChar)
      const unicodeStr = `unicode: "${unicode}",\n    `
      transformed = transformed.replace(/(examples:\s*\[\],\s*)/, `$1${unicodeStr}`)
    }
    
    // 8. tags 추가
    if (!transformed.includes('tags:')) {
      const tagsStr = `tags: [],\n    `
      transformed = transformed.replace(/(unicode:\s*"[^"]+",\s*)/, `$1${tagsStr}`)
    }
    
    // 9. jlptFrequency, commonUsage 추가
    if (!transformed.includes('jlptFrequency:')) {
      const frequencyStr = `jlptFrequency: null,\n    commonUsage: null,\n    `
      transformed = transformed.replace(/(tags:\s*\[\],\s*)/, `$1${frequencyStr}`)
    }
    
    // 내용 교체
    content = content.substring(0, start) + transformed + content.substring(end)
  }
  
  // 파일 저장
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`${level} 파일 변환 완료!`)
  } else {
    console.log(`${level} 파일은 이미 변환된 것 같습니다.`)
  }
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
