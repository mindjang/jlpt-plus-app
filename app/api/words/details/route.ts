import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { WordDetails, Level } from '@/data/types'

// 캐시 (메모리 캐시)
const indexCache = new Map<string, any>()
const chunkCache = new Map<string, WordDetails[]>()

/**
 * 단어 상세 정보 API
 * GET /api/words/details?entry=あき&level=N5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entry = searchParams.get('entry')
    const level = searchParams.get('level') as Level

    if (!entry || !level) {
      return NextResponse.json(
        { error: 'entry and level are required' },
        { status: 400 }
      )
    }

    // 레벨 검증
    const validLevels: Level[] = ['N1', 'N2', 'N3', 'N4', 'N5']
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level' },
        { status: 400 }
      )
    }

    const cacheKey = `${level}:${entry}`

    // 1. index 파일 로드 (캐시 확인)
    const levelLower = level.toLowerCase()
    const indexPath = path.join(
      process.cwd(),
      'data',
      'words',
      'details',
      levelLower,
      `${levelLower}-details-index.json`
    )

    let indexData: any
    const indexCacheKey = `index:${level}`
    
    if (indexCache.has(indexCacheKey)) {
      indexData = indexCache.get(indexCacheKey)
    } else {
      if (!fs.existsSync(indexPath)) {
        return NextResponse.json(
          { error: 'Index file not found' },
          { status: 404 }
        )
      }

      const indexContent = fs.readFileSync(indexPath, 'utf-8')
      indexData = JSON.parse(indexContent)
      indexCache.set(indexCacheKey, indexData)
    }

    // 2. entry에 해당하는 chunk 파일 찾기
    const chunkFile = indexData.entryToChunk?.[entry]

    if (!chunkFile) {
      return NextResponse.json(
        { error: 'Entry not found in index' },
        { status: 404 }
      )
    }

    // 3. chunk 파일 로드 (캐시 확인)
    let chunkData: WordDetails[]
    const chunkCacheKey = `chunk:${level}:${chunkFile}`

    if (chunkCache.has(chunkCacheKey)) {
      chunkData = chunkCache.get(chunkCacheKey)!
    } else {
      const chunkPath = path.join(
        process.cwd(),
        'data',
        'words',
        'details',
        levelLower,
        chunkFile
      )

      if (!fs.existsSync(chunkPath)) {
        return NextResponse.json(
          { error: 'Chunk file not found' },
          { status: 404 }
        )
      }

      const chunkContent = fs.readFileSync(chunkPath, 'utf-8')
      chunkData = JSON.parse(chunkContent)
      chunkCache.set(chunkCacheKey, chunkData)
    }

    // 4. 해당 entry 찾기
    const wordDetails = chunkData.find((item) => item.entry === entry) || null

    if (!wordDetails) {
      return NextResponse.json(
        { error: 'Word details not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(wordDetails, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error: any) {
    console.error('[api/words/details] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

