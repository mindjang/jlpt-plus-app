/**
 * 관리자용 예문 콘텐츠 관리 API
 * GET: 레벨별 예문 목록 조회
 * POST: 새 예문 추가
 * PUT: 예문 수정
 * DELETE: 예문 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { WordDetails, ExampleItem, Level } from '@/data/types'

const DETAILS_DIR = join(process.cwd(), 'data', 'words', 'details')

// 레벨별 디렉토리 경로
const getDetailsDir = (level: Level): string => {
  return join(DETAILS_DIR, level.toLowerCase())
}

// Index 파일 로드
async function loadIndex(level: Level): Promise<any> {
  const levelLower = level.toLowerCase()
  const indexPath = join(getDetailsDir(level), `${levelLower}-details-index.json`)
  const content = await readFile(indexPath, 'utf-8')
  return JSON.parse(content)
}

// Chunk 파일 로드
async function loadChunk(level: Level, chunkFile: string): Promise<WordDetails[]> {
  const chunkPath = join(getDetailsDir(level), chunkFile)
  const content = await readFile(chunkPath, 'utf-8')
  return JSON.parse(content)
}

// Chunk 파일 저장
async function saveChunk(level: Level, chunkFile: string, data: WordDetails[]): Promise<void> {
  const chunkPath = join(getDetailsDir(level), chunkFile)
  await writeFile(chunkPath, JSON.stringify(data, null, 2), 'utf-8')
}

// Index 파일 저장
async function saveIndex(level: Level, indexData: any): Promise<void> {
  const levelLower = level.toLowerCase()
  const indexPath = join(getDetailsDir(level), `${levelLower}-details-index.json`)
  await writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')
}

// 모든 예문 가져오기 (레벨별)
async function getAllExamples(level: Level): Promise<Array<{ entry: string; example: ExampleItem; wordDetails: WordDetails }>> {
  const indexData = await loadIndex(level)
  const chunkFiles = indexData.chunkFiles || []
  const allExamples: Array<{ entry: string; example: ExampleItem; wordDetails: WordDetails }> = []

  // 캐시를 사용하여 중복 로드 방지
  const chunkCache = new Map<string, WordDetails[]>()

  for (const chunkFile of chunkFiles) {
    let chunkData: WordDetails[]
    
    if (chunkCache.has(chunkFile)) {
      chunkData = chunkCache.get(chunkFile)!
    } else {
      chunkData = await loadChunk(level, chunkFile)
      chunkCache.set(chunkFile, chunkData)
    }

    for (const wordDetails of chunkData) {
      if (wordDetails.examples && wordDetails.examples.length > 0) {
        for (const example of wordDetails.examples) {
          allExamples.push({
            entry: wordDetails.entry,
            example,
            wordDetails,
          })
        }
      }
    }
  }

  return allExamples
}

// GET: 레벨별 예문 목록 조회
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { requireAuth } = await import('@/lib/firebase/auth-middleware')
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
    const examples = await getAllExamples(level)
    return NextResponse.json({ examples, count: examples.length })
  } catch (error) {
    console.error('Error loading examples:', error)
    return NextResponse.json(
      { error: 'Failed to load examples' },
      { status: 500 }
    )
  }
}

// POST: 새 예문 추가
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { requireAuth } = await import('@/lib/firebase/auth-middleware')
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, entry, example } = body as {
      level: Level
      entry: string
      example: ExampleItem
    }

    if (!level || !entry || !example) {
      return NextResponse.json(
        { error: 'level, entry, and example are required' },
        { status: 400 }
      )
    }

    const indexData = await loadIndex(level)
    const chunkFile = indexData.entryToChunk[entry]

    if (!chunkFile) {
      return NextResponse.json(
        { error: 'Word entry not found' },
        { status: 404 }
      )
    }

    const chunkData = await loadChunk(level, chunkFile)
    const wordIndex = chunkData.findIndex((w) => w.entry === entry)

    if (wordIndex === -1) {
      return NextResponse.json(
        { error: 'Word not found in chunk' },
        { status: 404 }
      )
    }

    // 예문 추가
    if (!chunkData[wordIndex].examples) {
      chunkData[wordIndex].examples = []
    }
    chunkData[wordIndex].examples.push(example)

    await saveChunk(level, chunkFile, chunkData)

    return NextResponse.json({ success: true, example })
  } catch (error) {
    console.error('Error adding example:', error)
    return NextResponse.json(
      { error: 'Failed to add example' },
      { status: 500 }
    )
  }
}

// PUT: 예문 수정
export async function PUT(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { requireAuth } = await import('@/lib/firebase/auth-middleware')
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const body = await request.json()
    const { level, entry, exampleRank, example } = body as {
      level: Level
      entry: string
      exampleRank: string
      example: Partial<ExampleItem>
    }

    if (!level || !entry || !exampleRank) {
      return NextResponse.json(
        { error: 'level, entry, and exampleRank are required' },
        { status: 400 }
      )
    }

    const indexData = await loadIndex(level)
    const chunkFile = indexData.entryToChunk[entry]

    if (!chunkFile) {
      return NextResponse.json(
        { error: 'Word entry not found' },
        { status: 404 }
      )
    }

    const chunkData = await loadChunk(level, chunkFile)
    const wordIndex = chunkData.findIndex((w) => w.entry === entry)

    if (wordIndex === -1 || !chunkData[wordIndex].examples) {
      return NextResponse.json(
        { error: 'Example not found' },
        { status: 404 }
      )
    }

    const exampleIndex = chunkData[wordIndex].examples.findIndex(
      (e) => e.rank === exampleRank
    )

    if (exampleIndex === -1) {
      return NextResponse.json(
        { error: 'Example not found' },
        { status: 404 }
      )
    }

    chunkData[wordIndex].examples[exampleIndex] = {
      ...chunkData[wordIndex].examples[exampleIndex],
      ...example,
    }

    await saveChunk(level, chunkFile, chunkData)

    return NextResponse.json({
      success: true,
      example: chunkData[wordIndex].examples[exampleIndex],
    })
  } catch (error) {
    console.error('Error updating example:', error)
    return NextResponse.json(
      { error: 'Failed to update example' },
      { status: 500 }
    )
  }
}

// DELETE: 예문 삭제
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const { requireAuth } = await import('@/lib/firebase/auth-middleware')
    const [user, authError] = await requireAuth(request)
    if (authError) return authError
  }

  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as Level | null
    const entry = searchParams.get('entry')
    const exampleRank = searchParams.get('exampleRank')

    if (!level || !entry || !exampleRank) {
      return NextResponse.json(
        { error: 'level, entry, and exampleRank are required' },
        { status: 400 }
      )
    }

    const indexData = await loadIndex(level)
    const chunkFile = indexData.entryToChunk[entry]

    if (!chunkFile) {
      return NextResponse.json(
        { error: 'Word entry not found' },
        { status: 404 }
      )
    }

    const chunkData = await loadChunk(level, chunkFile)
    const wordIndex = chunkData.findIndex((w) => w.entry === entry)

    if (wordIndex === -1 || !chunkData[wordIndex].examples) {
      return NextResponse.json(
        { error: 'Example not found' },
        { status: 404 }
      )
    }

    const exampleIndex = chunkData[wordIndex].examples.findIndex(
      (e) => e.rank === exampleRank
    )

    if (exampleIndex === -1) {
      return NextResponse.json(
        { error: 'Example not found' },
        { status: 404 }
      )
    }

    chunkData[wordIndex].examples.splice(exampleIndex, 1)

    await saveChunk(level, chunkFile, chunkData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting example:', error)
    return NextResponse.json(
      { error: 'Failed to delete example' },
      { status: 500 }
    )
  }
}
