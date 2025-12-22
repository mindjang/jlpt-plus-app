/**
 * 퀴즈 문제 생성기
 * 혼합 전략: 랜덤 70% + 약점 30%
 */
import type { JlptLevel } from '@/lib/types/content'
import type { NaverWord, KanjiAliveEntry } from '@/data/types'
import type {
  QuizQuestion,
  QuizQuestionType,
  QuizSettings,
  ItemStats,
} from '@/lib/types/quiz'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import { getKanjiByLevelAsync } from '@/data/kanji/index'
import { getKanjiCharacter, getKanjiMeaning } from '@/lib/data/kanji/kanjiHelpers'
import { getWordDetails, getWordDetailsBatch } from '@/data/words/details'

/**
 * 혼합 전략으로 퀴즈 문제 생성
 */
export async function generateQuizQuestions(
  settings: QuizSettings,
  weakItemsMap: Record<string, ItemStats>
): Promise<QuizQuestion[]> {
  const { levels, questionCount, questionTypes } = settings

  // 문장 완성 문제만 선택된 경우, 예문이 있는 단어만 필터링
  const isSentenceFillInOnly = questionTypes.length === 1 && questionTypes[0] === 'sentence-fill-in'

  // 1. 모든 아이템 수집 (단어와 한자 모두 포함)
  const allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }> = []

  for (const level of levels) {
    // 단어와 한자 모두 포함
    const words = await getNaverWordsByLevelAsync(level)
    words.forEach((word) => allItems.push({ data: word, type: 'word', level }))
    
    const kanjis = await getKanjiByLevelAsync(level)
    kanjis.forEach((kanji) => allItems.push({ data: kanji, type: 'kanji', level }))
  }

  if (allItems.length === 0) {
    return []
  }

  // 문장 완성만 선택된 경우: 예문이 있는 단어만 효율적으로 필터링
  let filteredItems = allItems
  if (isSentenceFillInOnly) {
    const wordItems = allItems.filter(item => item.type === 'word')
    
    // 랜덤으로 섞기
    const shuffledWords = shuffle(wordItems)
    
    const wordsWithExamples: Array<{ data: NaverWord; type: 'word'; level: JlptLevel }> = []
    let checkedCount = 0
    const initialSampleSize = Math.min(questionCount * 3, shuffledWords.length)
    
    // 초기 샘플링: 문제 수의 3배만큼 확인
    while (wordsWithExamples.length < questionCount && checkedCount < shuffledWords.length) {
      const remainingNeeded = questionCount - wordsWithExamples.length
      const batchSize = Math.min(
        checkedCount === 0 ? initialSampleSize : remainingNeeded * 2, // 첫 배치는 3배, 이후는 필요한 만큼의 2배
        shuffledWords.length - checkedCount
      )
      
      const batchWords = shuffledWords.slice(checkedCount, checkedCount + batchSize)
      
      // 각 단어의 실제 레벨로 details 확인
      for (let i = 0; i < batchWords.length; i++) {
        const wordItem = batchWords[i]
        const word = wordItem.data as NaverWord
        const wordLevel = wordItem.level
        
        // 각 단어의 실제 레벨로 details 로드
        const details = await getWordDetails(word.entry, wordLevel)
        
        if (details && details.examples && details.examples.length > 0) {
          // 예문에 해당 단어가 포함되어 있는지 확인
          const hasValidExample = details.examples.some(example => {
            const cleanExample = example.expExample1.replace(/<[^>]+>/g, '')
            return cleanExample.includes(word.entry)
          })
          
          if (hasValidExample) {
            wordsWithExamples.push({
              data: word,
              type: 'word',
              level: wordLevel
            })
            
            // 문제 수만큼 찾으면 중단
            if (wordsWithExamples.length >= questionCount) {
              break
            }
          }
        }
      }
      
      checkedCount += batchSize
      
      // 문제 수를 채웠으면 중단
      if (wordsWithExamples.length >= questionCount) {
        break
      }
    }
    
    if (wordsWithExamples.length === 0) {
      console.warn('[Quiz] No words with valid examples found for sentence-fill-in')
      return []
    }
    
    filteredItems = wordsWithExamples
  }

  // 2. 약점 아이템 분리 (정답률 60% 미만)
  const weakItems = filteredItems.filter((item) => {
    const itemId = getItemId(item.data, item.type)
    const stats = weakItemsMap[itemId]
    return stats && stats.accuracy < 0.6 && stats.attempts >= 2
  })

  // 3. 혼합 전략 적용
  const weakCount = Math.min(Math.floor(questionCount * 0.3), weakItems.length)
  const randomCount = questionCount - weakCount

  const selectedWeak = shuffle(weakItems).slice(0, weakCount)
  const remainingItems = filteredItems.filter(
    (item) => !selectedWeak.some((w) => getItemId(w.data, w.type) === getItemId(item.data, item.type))
  )
  const selectedRandom = shuffle(remainingItems).slice(0, randomCount)

  const selectedItems = shuffle([...selectedWeak, ...selectedRandom])

  // 4. 문제 타입 결정 및 생성
  const questions: QuizQuestion[] = []

  for (const item of selectedItems) {
    // 문장 완성은 단어에서만 생성 가능
    const availableTypes = item.type === 'word' 
      ? questionTypes 
      : questionTypes.filter(t => t !== 'sentence-fill-in')
    
    if (availableTypes.length === 0) {
      // 한자인데 문장 완성만 선택된 경우는 건너뛰기 (이미 필터링되어 있지만 안전장치)
      continue
    } else {
      const questionType = determineQuestionType(availableTypes)
      const question = await createQuestion(item.data, item.type, item.level, questionType, allItems, isSentenceFillInOnly)
      if (question) {
        questions.push(question)
      }
    }
  }

  return questions.slice(0, questionCount)
}

/**
 * 문제 타입 결정
 */
function determineQuestionType(allowedTypes: QuizQuestionType[]): QuizQuestionType {
  // 지정된 타입 중 랜덤 선택 (최소 1개는 보장됨)
  return allowedTypes[Math.floor(Math.random() * allowedTypes.length)]
}

/**
 * 단일 문제 생성
 */
async function createQuestion(
  data: NaverWord | KanjiAliveEntry,
  itemType: 'word' | 'kanji',
  level: JlptLevel,
  questionType: QuizQuestionType,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>,
  isSentenceFillInOnly: boolean = false
): Promise<QuizQuestion | null> {
  const itemId = getItemId(data, itemType)

  if (itemType === 'word') {
    return createWordQuestion(data as NaverWord, level, questionType, allItems, isSentenceFillInOnly)
  } else {
    return createKanjiQuestion(data as KanjiAliveEntry, level, questionType, allItems)
  }
}

/**
 * 단어 문제 생성
 */
async function createWordQuestion(
  word: NaverWord,
  level: JlptLevel,
  questionType: QuizQuestionType,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>,
  isSentenceFillInOnly: boolean = false
): Promise<QuizQuestion | null> {
  // 문장 빈칸 채우기는 별도 함수로 처리
  if (questionType === 'sentence-fill-in') {
    return createSentenceFillInQuestion(word, level, allItems, isSentenceFillInOnly)
  }

  const itemId = `word:${word.entry}`
  const firstMeaning = word.partsMeans?.[0]?.means?.[0]
  
  if (!firstMeaning) return null

  const kanjiText = word.kanji || word.entry
  const meaningText = firstMeaning

  let question: string
  let answer: string

  if (questionType === 'word-to-meaning') {
    question = kanjiText
    answer = meaningText
  } else {
    question = meaningText
    answer = kanjiText
  }

  // 오답 생성
  const wrongOptions = generateWrongOptions(answer, questionType, level, allItems, 'word')
  const options = shuffle([answer, ...wrongOptions]).slice(0, 4)

  // 정답이 포함되어 있는지 확인
  if (!options.includes(answer)) {
    options[0] = answer
    shuffle(options)
  }

  return {
    id: `${itemId}-${Date.now()}-${Math.random()}`,
    type: questionType,
    question,
    answer,
    options,
    itemId,
    itemType: 'word',
    level,
    questionData: word,
  }
}

/**
 * 한자 문제 생성
 */
function createKanjiQuestion(
  kanji: KanjiAliveEntry,
  level: JlptLevel,
  questionType: QuizQuestionType,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>
): QuizQuestion | null {
  // 한자는 문장 완성 문제를 생성할 수 없음
  if (questionType === 'sentence-fill-in') {
    // word-to-meaning으로 대체
    questionType = 'word-to-meaning'
  }

  const character = getKanjiCharacter(kanji)
  const meaning = getKanjiMeaning(kanji)
  const itemId = `kanji:${character}`

  if (!meaning) return null

  let question: string
  let answer: string

  if (questionType === 'word-to-meaning') {
    question = character
    answer = meaning
  } else {
    question = meaning
    answer = character
  }

  // 오답 생성
  const wrongOptions = generateWrongOptions(answer, questionType, level, allItems, 'kanji')
  const options = shuffle([answer, ...wrongOptions]).slice(0, 4)

  // 정답이 포함되어 있는지 확인
  if (!options.includes(answer)) {
    options[0] = answer
    shuffle(options)
  }

  return {
    id: `${itemId}-${Date.now()}-${Math.random()}`,
    type: questionType,
    question,
    answer,
    options,
    itemId,
    itemType: 'kanji',
    level,
    questionData: kanji,
  }
}

/**
 * 오답 생성
 */
function generateWrongOptions(
  correctAnswer: string,
  questionType: QuizQuestionType,
  level: JlptLevel,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>,
  itemType: 'word' | 'kanji'
): string[] {
  const wrongOptions: string[] = []
  const candidates = allItems.filter((item) => item.type === itemType)

  // 같은 레벨 아이템 우선
  const sameLevelCandidates = candidates.filter((item) => item.level === level)
  const otherLevelCandidates = candidates.filter((item) => item.level !== level)

  const shuffledCandidates = shuffle([...sameLevelCandidates, ...otherLevelCandidates])

  for (const candidate of shuffledCandidates) {
    if (wrongOptions.length >= 3) break

    let optionText: string

    if (itemType === 'word') {
      const word = candidate.data as NaverWord
      if (questionType === 'word-to-meaning') {
        optionText = word.partsMeans?.[0]?.means?.[0] || ''
      } else {
        optionText = word.kanji || word.entry
      }
    } else {
      const kanji = candidate.data as KanjiAliveEntry
      if (questionType === 'word-to-meaning') {
        optionText = getKanjiMeaning(kanji) || ''
      } else {
        optionText = getKanjiCharacter(kanji)
      }
    }

    // 정답과 다르고, 이미 추가되지 않은 경우만 추가
    if (optionText && optionText !== correctAnswer && !wrongOptions.includes(optionText)) {
      wrongOptions.push(optionText)
    }
  }

  // 부족한 경우 더미 옵션 추가
  while (wrongOptions.length < 3) {
    wrongOptions.push(`옵션 ${wrongOptions.length + 1}`)
  }

  return wrongOptions
}

/**
 * 아이템 ID 생성
 */
export function getItemId(data: NaverWord | KanjiAliveEntry, type: 'word' | 'kanji'): string {
  if (type === 'word') {
    return `word:${(data as NaverWord).entry}`
  } else {
    return `kanji:${getKanjiCharacter(data as KanjiAliveEntry)}`
  }
}

/**
 * 문장 빈칸 채우기 문제 생성
 */
async function createSentenceFillInQuestion(
  word: NaverWord,
  level: JlptLevel,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>,
  isSentenceFillInOnly: boolean = false
): Promise<QuizQuestion | null> {
  try {
    // 1. WordDetails 로드
    const details = await getWordDetails(word.entry, level)
    if (!details || details.examples.length === 0) {
      // 문장 완성만 선택된 경우 fallback하지 않고 null 반환
      if (isSentenceFillInOnly) {
        console.log(`[Quiz] No examples for "${word.entry}", skipping (sentence-fill-in only)`)
        return null
      }
      // 다른 문제 유형도 선택된 경우에만 fallback
      console.log(`[Quiz] No examples for "${word.entry}", falling back to word-to-meaning`)
      return createWordQuestion(word, level, 'word-to-meaning', allItems, false)
    }

    // 2. 랜덤 예문 선택
    const example = details.examples[Math.floor(Math.random() * details.examples.length)]
    
    // 3. 정답 단어 추출 (word.entry가 깨끗한 히라가나)
    const answerWord = word.entry
    
    // 4. 빈칸 위치 찾기 (HTML 태그 제거한 버전에서 찾기)
    const cleanExample = example.expExample1.replace(/<[^>]+>/g, '')
    const blankStart = cleanExample.indexOf(answerWord)
    
    if (blankStart === -1) {
      // 문장 완성만 선택된 경우 fallback하지 않고 null 반환
      if (isSentenceFillInOnly) {
        console.log(`[Quiz] Word "${answerWord}" not found in example, skipping (sentence-fill-in only)`)
        return null
      }
      // 다른 문제 유형도 선택된 경우에만 fallback
      console.log(`[Quiz] Word "${answerWord}" not found in example, falling back to word-to-meaning`)
      return createWordQuestion(word, level, 'word-to-meaning', allItems, false)
    }

    // 5. 품사 추출
    const partOfSpeech = details.words[0]?.meansCollector[0]?.partOfSpeech

    // 6. 오답 생성
    const wrongAnswers = generateSimilarWords(word, partOfSpeech, level, allItems, 3)

    // 7. 문제 텍스트 생성: entry가 <ruby> 태그로 감싸져 있으면 전체 <ruby> 태그를 빈칸으로 치환
    let questionText = example.expExample1
    
    // entry가 <ruby> 태그 내부에 있는지 확인하고, 있으면 전체 <ruby> 태그를 치환
    // 정규식으로 <ruby>...</ruby> 태그를 찾되, 내부에 entry가 포함된 경우
    const escapedAnswerWord = answerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // <ruby> 태그 내부에 entry가 있는지 확인하는 정규식
    // entry는 <rt> 태그 내부에 있을 수 있고, <strong> 태그로 감싸져 있을 수도 있음
    const rubyTagRegex = /<ruby>[\s\S]*?<\/ruby>/g
    questionText = questionText.replace(rubyTagRegex, (match) => {
      // <ruby> 태그 내부에 entry가 있는지 확인 (태그 제거한 텍스트에서)
      const rubyContent = match.replace(/<[^>]+>/g, '')
      if (rubyContent.includes(answerWord)) {
        return '___'
      }
      return match
    })
    
    // 혹시 <ruby> 태그 밖에 <strong>entry</strong>가 있는 경우도 처리 (fallback)
    if (questionText.includes(`<strong>${answerWord}</strong>`)) {
      questionText = questionText.replace(new RegExp(`<strong>${escapedAnswerWord}<\/strong>`, 'gi'), '___')
    }

    const itemId = `word:${word.entry}`

    return {
      id: `${itemId}-${Date.now()}-${Math.random()}`,
      type: 'sentence-fill-in',
      question: questionText,
      answer: answerWord,
      options: shuffle([answerWord, ...wrongAnswers]),
      sentenceJa: example.expExample1,
      sentenceKo: example.expExample2,
      blankPosition: { start: blankStart, end: blankStart + answerWord.length },
      itemId,
      itemType: 'word',
      level,
      questionData: word,
    }
  } catch (error) {
    console.error('[createSentenceFillInQuestion] Error:', error)
    // 문장 완성만 선택된 경우 fallback하지 않고 null 반환
    if (isSentenceFillInOnly) {
      return null
    }
    // 다른 문제 유형도 선택된 경우에만 fallback
    return createWordQuestion(word, level, 'word-to-meaning', allItems, false)
  }
}

/**
 * 품사가 비슷한 단어 찾기 (오답 생성용)
 */
function generateSimilarWords(
  targetWord: NaverWord,
  targetPartOfSpeech: string | undefined,
  level: JlptLevel,
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>,
  count: number
): string[] {
  // 같은 레벨의 단어들 필터링
  const sameLevel = allItems.filter(item => 
    item.type === 'word' && 
    item.level === level &&
    (item.data as NaverWord).entry !== targetWord.entry
  )

  if (sameLevel.length === 0) {
    return []
  }

  // 같은 품사 우선 (품사 정보가 있는 경우)
  let candidates = sameLevel
  
  if (targetPartOfSpeech) {
    // 품사 매칭 (간단한 버전 - means에서 품사 키워드 찾기)
    const samePOS = sameLevel.filter(item => {
      const word = item.data as NaverWord
      const firstMean = word.partsMeans?.[0]?.means?.[0] || ''
      
      // 품사 키워드 매칭
      if (targetPartOfSpeech.includes('명사') && (firstMean.includes('명사') || firstMean.includes('것'))) return true
      if (targetPartOfSpeech.includes('동사') && (firstMean.includes('동사') || firstMean.includes('하다'))) return true
      if (targetPartOfSpeech.includes('형용사') && firstMean.includes('형용사')) return true
      if (targetPartOfSpeech.includes('부사') && firstMean.includes('부사')) return true
      
      return false
    })

    if (samePOS.length >= count) {
      candidates = samePOS
    }
  }

  // 랜덤 선택
  const shuffled = shuffle(candidates)
  return shuffled
    .slice(0, count)
    .map(item => (item.data as NaverWord).entry)
    .filter(entry => entry && entry.length > 0)
}

/**
 * 배열 셔플
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

