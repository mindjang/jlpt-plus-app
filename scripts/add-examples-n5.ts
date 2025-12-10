import * as fs from 'fs'
import * as path from 'path'

interface TatoebaResult {
  id: number
  text: string
  lang: string
  transcriptions?: Array<{
    text: string
    script: string
  }>
  translations?: Array<Array<{
    id: number
    text: string
    lang: string
  }>>
}

interface TatoebaResponse {
  results: TatoebaResult[]
}

function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '')
}

async function fetchExamples(word: string): Promise<Array<{ ja: string; furigana?: string; ko: string }>> {
  const encodedWord = encodeURIComponent(word)
  const url = `https://tatoeba.org/ko/api_v0/search?from=jpn&has_audio=&list=&native=yes&original=&orphans=no&query=${encodedWord}&sort=created&sort_reverse=&tags=&to=kor&trans_filter=limit&trans_has_audio=&trans_link=&trans_native=&trans_trans_orphan=&trans_to=kor&trans_unapproved=&trans_user=&unapproved=no&user=&word_count_max=&word_count_min=1&limit=5`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`API 호출 실패 (${word}): ${response.status}`)
      return []
    }
    
    const data: TatoebaResponse = await response.json()
    const examples: Array<{ ja: string; furigana?: string; ko: string }> = []
    
    for (const result of data.results) {
      const ja = result.text
      const furigana = result.transcriptions?.[0]?.text
      
      // translations의 마지막 배열에서 한국어 번역 찾기
      let ko = ''
      if (result.translations && result.translations.length > 0) {
        const lastTranslationArray = result.translations[result.translations.length - 1]
        const korTranslation = lastTranslationArray.find(t => t.lang === 'kor')
        if (korTranslation) {
          ko = korTranslation.text
        }
      }
      
      if (ja && ko) {
        examples.push({
          ja,
          furigana,
          ko
        })
      }
    }
    
    return examples
  } catch (error) {
    console.error(`예문 가져오기 실패 (${word}):`, error)
    return []
  }
}

async function main() {
  const filePath = path.join(__dirname, '../data/words/n5.ts')
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // n5Words 배열에서 각 단어 추출
  const wordRegex = /word:\s*'([^']+)'/g
  const words: string[] = []
  let match
  
  while ((match = wordRegex.exec(content)) !== null) {
    words.push(match[1])
  }
  
  console.log(`총 ${words.length}개 단어 발견\n`)
  
  // 전체 처리
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    console.log(`[${i + 1}/10] ${word} 처리 중...`)
    
    const examples = await fetchExamples(word)
    
    if (examples.length > 0) {
      // meaning 필드 다음에 sentences 추가
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      // word로 시작하는 객체에서 meaning 다음을 찾기 (쉼표 있거나 없거나)
      const pattern1 = new RegExp(
        `(word:\\s*'${escapedWord}'[^}]*?meaning:\\s*'[^']+'\\s*,\\s*)`,
        's'
      )
      const pattern2 = new RegExp(
        `(word:\\s*'${escapedWord}'[^}]*?meaning:\\s*'[^']+'\\s*)(\\n\\s*\\})`,
        's'
      )
      
      let match = content.match(pattern1)
      let insertPos: number | null = null
      
      if (match) {
        insertPos = match.index! + match[0].length
      } else {
        match = content.match(pattern2)
        if (match) {
          insertPos = match.index! + match[1].length
        }
      }
      
      if (insertPos !== null) {
        // 이미 sentences가 있는지 확인
        const afterMeaning = content.substring(insertPos, insertPos + 200)
        if (afterMeaning.includes('sentences:')) {
          console.log(`  - 이미 sentences 존재, 건너뜀`)
        } else {
          const sentencesStr = `sentences: [${examples.map(ex => {
            return `{ ja: '${escapeString(ex.ja)}', ${ex.furigana ? `furigana: '${escapeString(ex.furigana)}', ` : ''}ko: '${escapeString(ex.ko)}' }`
          }).join(', ')}],\n    `
          
          content = content.slice(0, insertPos) + sentencesStr + content.slice(insertPos)
          console.log(`  ✓ ${examples.length}개 예문 추가됨`)
        }
      } else {
        console.log(`  - 패턴 매칭 실패`)
      }
    } else {
      console.log(`  - 예문 없음`)
    }
    
    // API 호출 제한을 피하기 위해 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 파일 저장
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log('\n완료!')
}

main().catch(console.error)
