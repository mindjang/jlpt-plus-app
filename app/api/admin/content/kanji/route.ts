/**
 * 관리자용 한자 콘텐츠 관리 API
 * GET: 레벨별 한자 목록 조회
 * POST: 새 한자 추가
 * PUT: 한자 수정
 * DELETE: 한자 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/firebase/auth-middleware'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { KanjiAliveEntry, Level } from '@/data/types'

const KANJI_DIR = join(process.cwd(), 'data', 'kanji')

// 레벨별 파일 경로 매핑
const getKanjiFilePath = (level: Level): string => {
  const levelMap: Record<Level, string> = {
    N5: 'n5.ts',
    N4: 'n4.ts',
    N3: 'n3.ts',
    N2: 'n2.ts',
    N1: 'n1.ts',
  }
  return join(KANJI_DIR, levelMap[level])
}

// TypeScript 파일에서 한자 배열 추출
async function loadKanjiFromFile(level: Level): Promise<KanjiAliveEntry[]> {
  const filePath = getKanjiFilePath(level)
  try {
    // 동적 import를 사용하여 TypeScript 모듈 직접 로드
    const levelNum = level.replace('N', '')
    const module = await import(`@/data/kanji/n${levelNum}`)
    const kanji = module[`n${levelNum}Kanji`] as KanjiAliveEntry[]
    return kanji || []
  } catch (error) {
    console.error(`Error loading kanji from ${filePath}:`, error)
    return []
  }
}

// TypeScript 파일에 한자 배열 저장
async function saveKanjiToFile(level: Level, kanji: KanjiAliveEntry[]): Promise<void> {
  const filePath = getKanjiFilePath(level)
  const levelNum = level.replace('N', '')
  const exportName = `n${levelNum}Kanji`
  
  // TypeScript 파일 생성
  const content = `import { KanjiAliveEntry } from '../types'

// ${level} 한자 데이터 (${kanji.length}개)
// 관리자 페이지에서 수정됨

export const ${exportName}: KanjiAliveEntry[] = ${JSON.stringify(kanji, null, 2)}
`
  
  await writeFile(filePath, content, 'utf-8')
}

// GET: 레벨별 한자 목록 조회
export async function GET(request: NextRequest) {
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
    const kanji = await loadKanjiFromFile(level)
    return NextResponse.json({ kanji, count: kanji.length })
  } catch (error) {
    console.error('Error loading kanji:', error)
    return NextResponse.json(
      { error: 'Failed to load kanji' },
      { status: 500 }
    )
  }
}

// POST: 새 한자 추가
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, kanji: newKanji } = body as { level: Level; kanji: KanjiAliveEntry }

    if (!level || !newKanji) {
      return NextResponse.json(
        { error: 'level and kanji are required' },
        { status: 400 }
      )
    }

    const kanjiList = await loadKanjiFromFile(level)
    const character = newKanji.ka_utf || newKanji.kanji?.character
    
    // 중복 체크
    const exists = kanjiList.some(
      k => (k.ka_utf || k.kanji?.character) === character
    )
    
    if (exists) {
      return NextResponse.json(
        { error: 'Kanji already exists' },
        { status: 409 }
      )
    }

    kanjiList.push(newKanji)
    await saveKanjiToFile(level, kanjiList)

    return NextResponse.json({ success: true, kanji: newKanji })
  } catch (error) {
    console.error('Error adding kanji:', error)
    return NextResponse.json(
      { error: 'Failed to add kanji' },
      { status: 500 }
    )
  }
}

// PUT: 한자 수정
export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, character, kanji: updatedKanji } = body as {
      level: Level
      character: string
      kanji: Partial<KanjiAliveEntry>
    }

    if (!level || !character) {
      return NextResponse.json(
        { error: 'level and character are required' },
        { status: 400 }
      )
    }

    const kanjiList = await loadKanjiFromFile(level)
    const index = kanjiList.findIndex(
      k => (k.ka_utf || k.kanji?.character) === character
    )

    if (index === -1) {
      return NextResponse.json(
        { error: 'Kanji not found' },
        { status: 404 }
      )
    }

    kanjiList[index] = { ...kanjiList[index], ...updatedKanji }
    await saveKanjiToFile(level, kanjiList)

    return NextResponse.json({ success: true, kanji: kanjiList[index] })
  } catch (error) {
    console.error('Error updating kanji:', error)
    return NextResponse.json(
      { error: 'Failed to update kanji' },
      { status: 500 }
    )
  }
}

// DELETE: 한자 삭제
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as Level | null
    const character = searchParams.get('character')

    if (!level || !character) {
      return NextResponse.json(
        { error: 'level and character are required' },
        { status: 400 }
      )
    }

    const kanjiList = await loadKanjiFromFile(level)
    const index = kanjiList.findIndex(
      k => (k.ka_utf || k.kanji?.character) === character
    )

    if (index === -1) {
      return NextResponse.json(
        { error: 'Kanji not found' },
        { status: 404 }
      )
    }

    kanjiList.splice(index, 1)
    await saveKanjiToFile(level, kanjiList)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kanji:', error)
    return NextResponse.json(
      { error: 'Failed to delete kanji' },
      { status: 500 }
    )
  }
}
