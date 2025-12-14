/**
 * 관리자용 단어 콘텐츠 관리 API
 * GET: 레벨별 단어 목록 조회
 * POST: 새 단어 추가
 * PUT: 단어 수정
 * DELETE: 단어 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { NaverWord, Level } from '@/data/types'

const WORDS_DIR = join(process.cwd(), 'data', 'words')

// 레벨별 파일 경로 매핑
const getWordsFilePath = (level: Level): string => {
  const levelMap: Record<Level, string> = {
    N5: 'n5.ts',
    N4: 'n4.ts',
    N3: 'n3.ts',
    N2: 'n2.ts',
    N1: 'n1.ts',
  }
  return join(WORDS_DIR, levelMap[level])
}

// TypeScript 파일에서 단어 배열 추출
async function loadWordsFromFile(level: Level): Promise<NaverWord[]> {
  const filePath = getWordsFilePath(level)
  try {
    // 동적 import를 사용하여 TypeScript 모듈 직접 로드
    const levelNum = level.replace('N', '')
    const module = await import(`@/data/words/n${levelNum}`)
    const words = module[`n${levelNum}Words`] as NaverWord[]
    return words || []
  } catch (error) {
    console.error(`Error loading words from ${filePath}:`, error)
    return []
  }
}

// TypeScript 파일에 단어 배열 저장
async function saveWordsToFile(level: Level, words: NaverWord[]): Promise<void> {
  const filePath = getWordsFilePath(level)
  const levelNum = level.replace('N', '')
  const exportName = `n${levelNum}Words`
  
  // TypeScript 파일 생성
  const content = `import type { NaverWord } from '../types'
// API: https://ja.dict.naver.com/api/jako/getJLPTList?level=${levelNum}
// 관리자 페이지에서 수정됨

export const ${exportName}: NaverWord[] = ${JSON.stringify(words, null, 2)}
`
  
  await writeFile(filePath, content, 'utf-8')
}

// GET: 레벨별 단어 목록 조회
export async function GET(request: NextRequest) {
  // 개발 환경에서는 인증 우회 (프로덕션에서는 필수)
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level') as Level | null

  if (!level || !['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
    return NextResponse.json(
      { error: 'Invalid level parameter' },
      { status: 400 }
    )
  }

  try {
    const words = await loadWordsFromFile(level)
    return NextResponse.json({ words, count: words.length })
  } catch (error) {
    console.error('Error loading words:', error)
    return NextResponse.json(
      { error: 'Failed to load words' },
      { status: 500 }
    )
  }
}

// POST: 새 단어 추가
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, word } = body as { level: Level; word: NaverWord }

    if (!level || !word) {
      return NextResponse.json(
        { error: 'level and word are required' },
        { status: 400 }
      )
    }

    const words = await loadWordsFromFile(level)
    
    // 중복 체크 (entry_id 또는 entry 기준)
    const exists = words.some(
      w => w.entry_id === word.entry_id || 
      (w.entry === word.entry && w.level === word.level)
    )
    
    if (exists) {
      return NextResponse.json(
        { error: 'Word already exists' },
        { status: 409 }
      )
    }

    words.push(word)
    await saveWordsToFile(level, words)

    return NextResponse.json({ success: true, word })
  } catch (error) {
    console.error('Error adding word:', error)
    return NextResponse.json(
      { error: 'Failed to add word' },
      { status: 500 }
    )
  }
}

// PUT: 단어 수정
export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, entryId, word } = body as {
      level: Level
      entryId: string
      word: Partial<NaverWord>
    }

    if (!level || !entryId) {
      return NextResponse.json(
        { error: 'level and entryId are required' },
        { status: 400 }
      )
    }

    const words = await loadWordsFromFile(level)
    const index = words.findIndex(w => w.entry_id === entryId)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }

    words[index] = { ...words[index], ...word }
    await saveWordsToFile(level, words)

    return NextResponse.json({ success: true, word: words[index] })
  } catch (error) {
    console.error('Error updating word:', error)
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    )
  }
}

// DELETE: 단어 삭제
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as Level | null
    const entryId = searchParams.get('entryId')

    if (!level || !entryId) {
      return NextResponse.json(
        { error: 'level and entryId are required' },
        { status: 400 }
      )
    }

    const words = await loadWordsFromFile(level)
    const index = words.findIndex(w => w.entry_id === entryId)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }

    words.splice(index, 1)
    await saveWordsToFile(level, words)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting word:', error)
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    )
  }
}
