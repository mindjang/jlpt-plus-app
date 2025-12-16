import { useState, useEffect, useRef } from 'react'
import { Level } from '@/data'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import { getKanjiByLevelAsync } from '@/data/kanji'
import { recordGameResult } from '@/lib/stats/calculator'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

export interface FallingItem {
  id: number
  text: string
  subText?: string
  answer: string
  x: number
  y: number
  speed: number
  isTarget: boolean
  color: string // 아이템별 색상
}

export interface PowerUp {
  type: 'slow' | 'bomb'
  active: boolean
  duration: number
}

export function useBlastEngine(level: Level, mode: 'word' | 'kanji') {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [items, setItems] = useState<FallingItem[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [combo, setCombo] = useState(0) // 콤보 카운터
  const [maxCombo, setMaxCombo] = useState(0) // 최대 콤보
  const [options, setOptions] = useState<string[]>([])
  const [powerUp, setPowerUp] = useState<PowerUp>({ type: 'slow', active: false, duration: 0 })
  const [particles, setParticles] = useState<any[]>([]) // 파티클 효과

  const itemsRef = useRef<FallingItem[]>([])
  const requestRef = useRef<number>()
  const lastSpawnTime = useRef<number>(0)
  const lastUpdateTime = useRef<number>(0)
  const spawnInterval = useRef<number>(1800) // 조금 더 빠르게
  const baseSpeed = useRef<number>(0.025)
  const poolRef = useRef<any[]>([])
  const livesRef = useRef<number>(5)
  const gameStateRef = useRef<GameState>('playing')
  const comboRef = useRef<number>(0)

  const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'] // 다양한 색상

  useEffect(() => {
    livesRef.current = lives
  }, [lives])

  useEffect(() => {
    gameStateRef.current = gameState
    if (gameState === 'gameover' && requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      
      // 통계 기록
      recordGameResult({
        gameType: 'blast',
        level,
        mode,
        score,
        combo: maxCombo,
        lives,
        timestamp: Date.now(),
      })
    }
  }, [gameState, level, mode, score, maxCombo, lives])

  useEffect(() => {
    comboRef.current = combo
  }, [combo])

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      let data: any[] = []
      if (mode === 'word') {
        const words = await getNaverWordsByLevelAsync(level)
        data = words
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
        const kanji = await getKanjiByLevelAsync(level)
        data = kanji
          .filter(k => k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning) // undefined 제거
          .map((k) => ({
            text: k.kanji?.character || k.ka_utf,
            subText: shortReading(k.kanji?.kunyomi?.hiragana || k.kunyomi_ja),
            answer: k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning,
          }))
      }
      
      // 데이터가 없으면 게임 시작하지 않음
      if (data.length === 0) {
        console.warn('[BlastGame] No data available for', level, mode)
        return
      }

      poolRef.current = data.sort(() => Math.random() - 0.5)

      spawnInterval.current = 1800
      baseSpeed.current = 0.025
      itemsRef.current = []
      setItems([])
      setScore(0)
      setLives(5)
      setCombo(0)
      setMaxCombo(0)
      setGameState('playing')
      lastSpawnTime.current = performance.now()
      lastUpdateTime.current = performance.now()

      // 데이터 로드 완료 후에만 게임 루프 시작
      requestRef.current = requestAnimationFrame(gameLoop)
    }

    loadData()

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [level, mode])

  // Game Loop
  const gameLoop = (time: number) => {
    if (gameStateRef.current !== 'playing') {
      return
    }

    // 데이터가 로드되지 않았으면 게임 루프 중단
    if (!poolRef.current || poolRef.current.length === 0) {
      return
    }

    // 파워업 처리
    if (powerUp.active && powerUp.duration > 0) {
      setPowerUp(prev => ({ ...prev, duration: prev.duration - 16 }))
    } else if (powerUp.active && powerUp.duration <= 0) {
      setPowerUp({ type: 'slow', active: false, duration: 0 })
    }

    const speedMultiplier = powerUp.active && powerUp.type === 'slow' ? 0.3 : 1

    // Spawn
    if (time - lastSpawnTime.current > spawnInterval.current) {
      spawnItem()
      lastSpawnTime.current = time
      if (spawnInterval.current > 1000) spawnInterval.current -= 8
      baseSpeed.current += 0.0008
    }

    // Move Items
    const newItems = itemsRef.current.map(item => ({
      ...item,
      y: item.y + (item.speed * speedMultiplier)
    }))

    // Check bounds
    const missedItems = newItems.filter(item => item.y > 90)
    if (missedItems.length > 0) {
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
      // 콤보 리셋
      setCombo(0)
      comboRef.current = 0

      const activeItems = newItems.filter(item => item.y <= 90)
      itemsRef.current = activeItems
      updateOptions(activeItems)
    } else {
      itemsRef.current = newItems
    }

    // Determine Target
    if (itemsRef.current.length > 0) {
      const sorted = [...itemsRef.current].sort((a, b) => b.y - a.y)
      const targetId = sorted[0].id
      itemsRef.current = itemsRef.current.map(i => ({ ...i, isTarget: i.id === targetId }))
    }

    const shouldUpdate = time - lastUpdateTime.current > 33
    if (shouldUpdate) {
      setItems([...itemsRef.current])
      lastUpdateTime.current = time
    }

    if (livesRef.current > 0 && gameStateRef.current === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop)
    }
  }

  const updateOptions = (currentItems: FallingItem[]) => {
    if (currentItems.length === 0) {
      setOptions([])
      return
    }
    const target = [...currentItems].sort((a, b) => b.y - a.y)[0]
    if (!target) return

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

  const spawnItem = () => {
    // poolRef가 비어있거나 초기화되지 않았으면 스폰하지 않음
    if (!poolRef.current || poolRef.current.length === 0) {
      return
    }

    const raw = poolRef.current[Math.floor(Math.random() * poolRef.current.length)]
    
    // raw가 undefined이거나 필수 필드가 없으면 스폰하지 않음
    if (!raw || !raw.text || !raw.answer) {
      return
    }

    const newItem: FallingItem = {
      id: Date.now() + Math.random(),
      text: raw.text,
      subText: raw.subText,
      answer: raw.answer,
      x: Math.random() * 80 + 10,
      y: 0,
      speed: baseSpeed.current + (Math.random() * 0.01),
      isTarget: false,
      color: colors[Math.floor(Math.random() * colors.length)]
    }

    itemsRef.current.push(newItem)

    if (itemsRef.current.length === 1) {
      updateOptions(itemsRef.current)
    }
  }

  const handleOptionClick = (selectedAnswer: string) => {
    if (gameStateRef.current !== 'playing' || itemsRef.current.length === 0) return

    const sorted = [...itemsRef.current].sort((a, b) => b.y - a.y)
    const target = sorted[0]

    if (selectedAnswer === target.answer) {
      // Correct!
      const comboMultiplier = Math.min(Math.floor(comboRef.current / 5) + 1, 5) // 5콤보마다 배수 증가 (최대 x5)
      const basePoints = 10 + Math.floor(target.speed * 100)
      const earnedPoints = basePoints * comboMultiplier

      setScore(s => s + earnedPoints)
      setCombo(c => {
        const newCombo = c + 1
        setMaxCombo(max => Math.max(max, newCombo))

        // 파워업 활성화 (10콤보마다)
        if (newCombo % 10 === 0) {
          const powerType = Math.random() > 0.5 ? 'slow' : 'bomb'
          if (powerType === 'bomb') {
            // 폭탄: 모든 아이템 제거
            itemsRef.current = []
            setItems([])
            setOptions([])
          } else {
            // 슬로우: 5초간 속도 감소
            setPowerUp({ type: 'slow', active: true, duration: 5000 })
          }
        }

        return newCombo
      })

      // 파티클 생성
      createParticles(target.x, target.y, target.color)

      const remaining = itemsRef.current.filter(i => i.id !== target.id)
      itemsRef.current = remaining
      setItems(remaining)
      updateOptions(remaining)
    } else {
      // Wrong!
      setCombo(0)
      comboRef.current = 0
      setLives(l => {
        const newLives = l - 1
        livesRef.current = newLives
        if (newLives <= 0) {
          setGameState('gameover')
          gameStateRef.current = 'gameover'
          if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
        return newLives
      })
    }
  }

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      color,
      angle: (Math.PI * 2 * i) / 8
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 500)
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
    setCombo(0)
    setMaxCombo(0)
    livesRef.current = 5
    setItems([])
    itemsRef.current = []
    spawnInterval.current = 1800
    baseSpeed.current = 0.025
    setGameState('playing')
    gameStateRef.current = 'playing'
    lastSpawnTime.current = performance.now()
    requestRef.current = requestAnimationFrame(gameLoop)
  }

  return {
    gameState,
    items,
    score,
    lives,
    combo,
    maxCombo,
    options,
    powerUp,
    particles,
    handleOptionClick,
    togglePause,
    restartGame
  }
}

function shortReading(input?: string) {
  if (!input) return undefined
  const token = input.split(/[,、・\s]+/).filter(Boolean)[0] || ''
  if (!token) return undefined
  if (token.length > 8) return undefined
  return token
}
