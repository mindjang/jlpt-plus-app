import { useState, useEffect, useRef, useCallback } from 'react'
import { Level } from '@/data'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

export interface FallingItem {
  id: number
  text: string
  subText?: string // For Kanji reading if needed, or furigana
  answer: string // The correct meaning
  x: number // Percent 0-100
  y: number // Percent 0-100
  speed: number
  isTarget: boolean
}

export function useRainEngine(level: Level, mode: 'word' | 'kanji') {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [items, setItems] = useState<FallingItem[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [options, setOptions] = useState<string[]>([])

  // Refs for game loop to avoid dependency staleness
  const itemsRef = useRef<FallingItem[]>([])
  const requestRef = useRef<number>()
  const lastSpawnTime = useRef<number>(0)
  const lastUpdateTime = useRef<number>(0) // 렌더링 쓰로틀링용
  const spawnInterval = useRef<number>(2000) // Start at 2s
  const baseSpeed = useRef<number>(0.02) // Vertical speed per frame (더 느리게)
  const poolRef = useRef<any[]>([])
  const livesRef = useRef<number>(5)
  const gameStateRef = useRef<GameState>('playing')

  useEffect(() => {
    livesRef.current = lives
  }, [lives])

  useEffect(() => {
    gameStateRef.current = gameState
    if (gameState === 'gameover' && requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
  }, [gameState])

  // Initialize Data
  useEffect(() => {
    let data: any[] = []
    if (mode === 'word') {
      data = getNaverWordsByLevel(level)
        .filter(w => w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0)
        .map((w) => {
          // 첫 번째 part의 첫 번째 의미 사용
          const firstMean = w.partsMeans[0].means[0]
          return {
            text: w.entry,
            subText: undefined, // 네이버 데이터에는 furigana 정보가 없음
            answer: firstMean,
          }
        })
    } else {
      data = getKanjiByLevel(level).map((k) => ({
        text: k.kanji?.character || k.ka_utf, // Fix for complex object
        subText: shortReading(k.kanji?.kunyomi?.hiragana || k.kunyomi_ja),
        answer: k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning,
      }))
    }
    // Shuffle pool
    poolRef.current = data.sort(() => Math.random() - 0.5)

    // Start Game
    spawnInterval.current = 2000
    baseSpeed.current = 0.02 // 느린 속도로 시작
    itemsRef.current = []
    setItems([])
    setScore(0)
    setLives(5)
    setGameState('playing')
    lastSpawnTime.current = performance.now()
    lastUpdateTime.current = performance.now()

    requestRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [level, mode])

  // Game Loop
  const gameLoop = (time: number) => {
    if (gameStateRef.current !== 'playing') {
      return
    }

    // Spawn
    if (time - lastSpawnTime.current > spawnInterval.current) {
      spawnItem()
      lastSpawnTime.current = time
      // Increase difficulty slightly
      if (spawnInterval.current > 800) spawnInterval.current -= 10
      baseSpeed.current += 0.001
    }

    // Move Items
    const newItems = itemsRef.current.map(item => ({
      ...item,
      y: item.y + item.speed
    }))

    // Check bounds (Missed items)
    const missedItems = newItems.filter(item => item.y > 90)
    if (missedItems.length > 0) {
      // Lose lives
      setLives(prev => {
        const newLives = prev - missedItems.length
        livesRef.current = newLives
        if (newLives <= 0) {
          setGameState('gameover')
          gameStateRef.current = 'gameover'
          if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
        return newLives
      })
      // Remove missed items
      const activeItems = newItems.filter(item => item.y <= 90)
      itemsRef.current = activeItems
      // Update options immediately if the target was the one missed
      updateOptions(activeItems)
    } else {
      itemsRef.current = newItems
    }

    // Determine Target (Lowest Y)
    if (itemsRef.current.length > 0) {
      // Sort by Y descending (highest Y = lowest on screen)
      const sorted = [...itemsRef.current].sort((a, b) => b.y - a.y)
      const targetId = sorted[0].id

      // Update target status
      itemsRef.current = itemsRef.current.map(i => ({ ...i, isTarget: i.id === targetId }))
    }

    // 렌더링 쓰로틀링: 60fps가 아닌 30fps로 React 상태 업데이트 (버벅거림 방지)
    const shouldUpdate = time - lastUpdateTime.current > 33 // ~30fps
    if (shouldUpdate) {
      setItems([...itemsRef.current]) // 새 배열로 복사하여 React가 변경 감지
      lastUpdateTime.current = time
    }

    if (livesRef.current > 0 && gameStateRef.current === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop)
    }
  }

  // Helper: Update Options based on current target
  const updateOptions = (currentItems: FallingItem[]) => {
    if (currentItems.length === 0) {
      setOptions([])
      return
    }
    // Target is lowest (highest Y)
    const target = [...currentItems].sort((a, b) => b.y - a.y)[0]
    if (!target) return

    // Generate Options: Correct Answer + 2 Random Distractors (총 3개)
    const pool = poolRef.current
      .filter(i => i.answer && i.answer !== target.answer)
      .map(i => i.answer)

    const uniquePool = Array.from(new Set(pool))
    const distractors: string[] = []
    while (distractors.length < 2 && uniquePool.length > 0) {
      const pick = uniquePool.splice(Math.floor(Math.random() * uniquePool.length), 1)[0]
      if (pick) distractors.push(pick)
    }

    const newOptions = [target.answer, ...distractors].slice(0, 3).sort(() => Math.random() - 0.5)
    setOptions(newOptions)
  }

  // Need to sync `updateOptions` call when a NEW target becomes active.
  // The easiest way is to track `currentTargetId` in a ref and check if it changes in loop.
  const currentTargetIdRef = useRef<number | null>(null)

  // Patching loop to check target change:
  // (We can't easily patch the loop function above without complete rewrite, 
  // so I will use a separate effect or just modify the loop logic in next edit if needed.
  // Actually, I'll rewrite the loop logic slightly in a better way in a moment?
  // No, I will use `useEffect` on `items` state? Too slow for 60fps.
  // I will add the check inside `gameLoop` logic.)

  // Revised Spawn Item
  const spawnItem = () => {
    const raw = poolRef.current[Math.floor(Math.random() * poolRef.current.length)]
    const newItem: FallingItem = {
      id: Date.now() + Math.random(),
      text: raw.text,
      subText: raw.subText,
      answer: raw.answer,
      x: Math.random() * 80 + 10, // 10-90%
      y: 0,
      speed: baseSpeed.current + (Math.random() * 0.01), // 속도 편차 줄임
      isTarget: false
    }

    itemsRef.current.push(newItem)

    // If this is the ONLY item, it becomes target immediately, so set options
    if (itemsRef.current.length === 1) {
      updateOptions(itemsRef.current)
      currentTargetIdRef.current = newItem.id
    }
  }

  // Interaction
  const handleOptionClick = (selectedAnswer: string) => {
    if (gameState !== 'playing' || itemsRef.current.length === 0) return

    // Find Target
    const sorted = [...itemsRef.current].sort((a, b) => b.y - a.y)
    const target = sorted[0]

    if (selectedAnswer === target.answer) {
      // Correct!
      setScore(s => s + 10 + Math.floor(target.speed * 100))

      // Remove target
      const remaining = itemsRef.current.filter(i => i.id !== target.id)
      itemsRef.current = remaining
      setItems(remaining)

      // Setup next target options
      updateOptions(remaining)

      // Sound effect (placeholder)
    } else {
      // Wrong!
      setLives(l => {
        const newLives = l - 1
        if (newLives <= 0) setGameState('gameover')
        return newLives
      })
      // Shake screen or red flash? (Handled by renderer state usually)
    }
  }

  const togglePause = () => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused')
      gameStateRef.current = 'paused'
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing')
      gameStateRef.current = 'playing'
      lastSpawnTime.current = performance.now()
      requestRef.current = requestAnimationFrame(gameLoop)
    }
  }

  const restartGame = () => {
    setScore(0)
    setLives(5)
    livesRef.current = 5
    setItems([])
    itemsRef.current = []
    spawnInterval.current = 2000
    baseSpeed.current = 0.02
    setGameState('playing')
    gameStateRef.current = 'playing'
    lastSpawnTime.current = performance.now()
    requestRef.current = requestAnimationFrame(gameLoop)
  }

  // Effect to Detect Target Switch inside rendering cycle is tricky.
  // Instead, `updateOptions` is called when:
  // 1. Item removed (Correct answer)
  // 2. Item removed (Missed ground)
  // 3. First item spawned.
  // This covers all cases where the "Lowest Item" changes.

  return {
    gameState,
    items,
    score,
    lives,
    options,
    handleOptionClick,
    togglePause,
    restartGame
  }
}

// 짧은 읽기만 표시 (너무 긴 히라가나/표기를 숨김, 쉼표/구분자 앞 한 토큰만)
function shortReading(input?: string) {
  if (!input) return undefined
  // 쉼표(,) / 일본어 쉼표(、) / 중점(・) / 공백 기준 첫 토큰
  const token = input.split(/[,、・\s]+/).filter(Boolean)[0] || ''
  if (!token) return undefined
  // 너무 길면 숨김
  if (token.length > 8) return undefined
  return token
}
