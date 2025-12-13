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
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji/index'
import { getKanjiCharacter, getKanjiMeaning } from '@/lib/data/kanji/kanjiHelpers'
import { getWordDetails } from '@/data/words/details'

/**
 * 혼합 전략으로 퀴즈 문제 생성
 */
export async function generateQuizQuestions(
  settings: QuizSettings,
  weakItemsMap: Record<string, ItemStats>
): Promise<QuizQuestion[]> {
  const { levels, questionCount, questionTypes, includeWords, includeKanji } = settings

  // 1. 모든 아이템 수집
  const allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }> = []

  for (const level of levels) {
    if (includeWords) {
      const words = getNaverWordsByLevel(level)
      words.forEach((word) => allItems.push({ data: word, type: 'word', level }))
    }
    if (includeKanji) {
      const kanjis = getKanjiByLevel(level)
      kanjis.forEach((kanji) => allItems.push({ data: kanji, type: 'kanji', level }))
    }
  }

  if (allItems.length === 0) {
    return []
  }

  // 2. 약점 아이템 분리 (정답률 60% 미만)
  const weakItems = allItems.filter((item) => {
    const itemId = getItemId(item.data, item.type)
    const stats = weakItemsMap[itemId]
    return stats && stats.accuracy < 0.6 && stats.attempts >= 2
  })

  // 3. 혼합 전략 적용
  const weakCount = Math.min(Math.floor(questionCount * 0.3), weakItems.length)
  const randomCount = questionCount - weakCount

  const selectedWeak = shuffle(weakItems).slice(0, weakCount)
  const remainingItems = allItems.filter(
    (item) => !selectedWeak.some((w) => getItemId(w.data, w.type) === getItemId(item.data, item.type))
  )
  const selectedRandom = shuffle(remainingItems).slice(0, randomCount)

  const selectedItems = shuffle([...selectedWeak, ...selectedRandom])

  // 4. 문제 타입 결정 및 생성
  const questions: QuizQuestion[] = []

  for (const item of selectedItems) {
    const questionType = determineQuestionType(questionTypes)
    const question = await createQuestion(item.data, item.type, item.level, questionType, allItems)
    if (question) {
      questions.push(question)
    }
  }

  return questions.slice(0, questionCount)
}

/**
 * 문제 타입 결정
 */
function determineQuestionType(allowedTypes: QuizQuestionType[]): QuizQuestionType {
  if (allowedTypes.length === 0) {
    // 혼합 모드: 33:33:33
    const rand = Math.random()
    if (rand < 0.33) return 'word-to-meaning'
    if (rand < 0.67) return 'meaning-to-word'
    return 'sentence-fill-in'
  }

  // 지정된 타입 중 랜덤 선택
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
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>
): Promise<QuizQuestion | null> {
  const itemId = getItemId(data, itemType)

  if (itemType === 'word') {
    return createWordQuestion(data as NaverWord, level, questionType, allItems)
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
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>
): Promise<QuizQuestion | null> {
  // 문장 빈칸 채우기는 별도 함수로 처리
  if (questionType === 'sentence-fill-in') {
    return createSentenceFillInQuestion(word, level, allItems)
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
  allItems: Array<{ data: NaverWord | KanjiAliveEntry; type: 'word' | 'kanji'; level: JlptLevel }>
): Promise<QuizQuestion | null> {
  try {
    // 1. WordDetails 로드
    const details = await getWordDetails(word.entry, level)
    if (!details || details.examples.length === 0) {
      // 예문이 없으면 일반 문제로 fallback
      return null
    }

    // 2. 랜덤 예문 선택
    const example = details.examples[Math.floor(Math.random() * details.examples.length)]
    
    // 3. 빈칸 위치 찾기
    const blankStart = example.expExample1.indexOf(example.expEntry)
    if (blankStart === -1) {
      // 예문에 해당 단어가 없으면 스킵
      return null
    }

    // 4. 품사 추출
    const partOfSpeech = details.words[0]?.meansCollector[0]?.partOfSpeech

    // 5. 오답 생성
    const wrongAnswers = generateSimilarWords(word, partOfSpeech, level, allItems, 3)

    const itemId = `word:${word.entry}`

    return {
      id: `${itemId}-${Date.now()}-${Math.random()}`,
      type: 'sentence-fill-in',
      question: example.expExample1.replace(example.expEntry, '___'),
      answer: example.expEntry,
      options: shuffle([example.expEntry, ...wrongAnswers]),
      sentenceJa: example.expExample1,
      sentenceKo: example.expExample2,
      blankPosition: { start: blankStart, end: blankStart + example.expEntry.length },
      itemId,
      itemType: 'word',
      level,
      questionData: word,
    }
  } catch (error) {
    console.error('[createSentenceFillInQuestion] Error:', error)
    return null
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

