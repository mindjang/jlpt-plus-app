'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type RainItem = {
  id: string
  text: string
  meaning: string
  x: number // 0~100 (vw 기준)
  y: number // 0~100 (vh 비율)
  speed: number // 퍼센트/초
}

export type RainSourceItem = {
  id: string
  text: string
  meaning: string
}

export type RainGameStatus = 'idle' | 'playing' | 'gameover'

interface UseRainGameOptions {
  source: RainSourceItem[]
  lives?: number
  baseSpeed?: number
  speedGain?: number
  spawnInterval?: number
  minSpawnInterval?: number
}

export function useRainGame({
  source,
  lives = 3,
  baseSpeed = 12, // % per second
  speedGain = 0.6, // % per second^2
  spawnInterval = 1200, // ms
  minSpawnInterval = 700,
}: UseRainGameOptions) {
  const [status, setStatus] = useState<RainGameStatus>('idle')
  const [score, setScore] = useState(0)
  const [life, setLife] = useState(lives)
  const [items, setItems] = useState<RainItem[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [activeTarget, setActiveTarget] = useState<string | null>(null)
  const [time, setTime] = useState(0)

  const requestRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number>(0)
  const lastSpawnRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)
  const poolIndexRef = useRef<number>(0)

  const sourceShuffled = useMemo(() => shuffle(source), [source])

  // Helpers
  const resetState = useCallback(() => {
    setStatus('playing')
    setScore(0)
    setLife(lives)
    setItems([])
    setOptions([])
    setActiveTarget(null)
    setTime(0)
    elapsedRef.current = 0
    poolIndexRef.current = 0
    lastSpawnRef.current = 0
    lastFrameRef.current = 0
  }, [lives])

  const pickNextSource = useCallback((): RainSourceItem | null => {
    if (sourceShuffled.length === 0) return null
    const idx = poolIndexRef.current % sourceShuffled.length
    poolIndexRef.current += 1
    return sourceShuffled[idx]
  }, [sourceShuffled])

  const spawnItem = useCallback(() => {
    const src = pickNextSource()
    if (!src) return
    const newItem: RainItem = {
      id: `${src.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      text: src.text,
      meaning: src.meaning,
      x: 10 + Math.random() * 80, // avoid edges
      y: 0,
      speed: baseSpeed + Math.random() * 6,
    }
    setItems((prev) => [...prev, newItem])
  }, [pickNextSource, baseSpeed])

  const computeActiveTarget = useCallback((list: RainItem[]) => {
    if (list.length === 0) return null
    return list.reduce((acc, cur) => (cur.y > acc.y ? cur : acc)).id
  }, [])

  const regenerateOptions = useCallback(
    (targetMeaning: string | null) => {
      if (!targetMeaning) {
        setOptions([])
        return
      }
      const poolMeanings = sourceShuffled.map((s) => s.meaning).filter((m) => m !== targetMeaning)
      const distractors = shuffle(poolMeanings).slice(0, 3)
      const merged = shuffle([targetMeaning, ...distractors]).slice(0, 4)
      setOptions(merged)
    },
    [sourceShuffled]
  )

  const start = useCallback(() => {
    resetState()
  }, [resetState])

  // Game loop
  useEffect(() => {
    if (status !== 'playing') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      requestRef.current = null
      return
    }

    const loop = (timestamp: number) => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp
        lastSpawnRef.current = timestamp
      }
      const deltaMs = timestamp - lastFrameRef.current
      lastFrameRef.current = timestamp
      const deltaSec = deltaMs / 1000

      elapsedRef.current += deltaMs
      setTime(Math.floor(elapsedRef.current / 1000))

      const currentSpeedBoost = (elapsedRef.current / 1000) * speedGain
      const currentSpawnInterval = Math.max(
        minSpawnInterval,
        spawnInterval - elapsedRef.current * 0.05 // 점진적 스폰 가속
      )

      setItems((prev) => {
        const updated: RainItem[] = []
        let lifeLost = 0

        for (const item of prev) {
          const newY = item.y + (item.speed + currentSpeedBoost) * deltaSec
          if (newY >= 100) {
            lifeLost += 1
            continue
          }
          updated.push({ ...item, y: newY })
        }

        if (lifeLost > 0) {
          setLife((l) => Math.max(0, l - lifeLost))
        }

        // Spawn control
        if (timestamp - lastSpawnRef.current >= currentSpawnInterval) {
          lastSpawnRef.current = timestamp
          if (updated.length < 6) {
            spawnItem()
          }
        }

        const nextActive = computeActiveTarget(updated)
        if (nextActive !== activeTarget) {
          setActiveTarget(nextActive)
          const target = updated.find((i) => i.id === nextActive)
          regenerateOptions(target?.meaning || null)
        }

        return updated
      })

      requestRef.current = requestAnimationFrame(loop)
    }

    requestRef.current = requestAnimationFrame(loop)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [
    status,
    spawnItem,
    computeActiveTarget,
    regenerateOptions,
    activeTarget,
    speedGain,
    spawnInterval,
    minSpawnInterval,
  ])

  // Game over check
  useEffect(() => {
    if (life <= 0 && status === 'playing') {
      setStatus('gameover')
    }
  }, [life, status])

  const handleAnswer = useCallback(
    (choice: string) => {
      if (status !== 'playing') return
      const target = items.find((i) => i.id === activeTarget)
      if (!target) return

      if (choice === target.meaning) {
        // correct
        setScore((s) => s + 10)
        setItems((prev) => prev.filter((i) => i.id !== target.id))
      } else {
        setLife((l) => Math.max(0, l - 1))
      }
    },
    [activeTarget, items, status]
  )

  const restart = useCallback(() => {
    resetState()
  }, [resetState])

  return {
    status,
    score,
    life,
    time,
    items,
    options,
    activeTarget,
    start,
    restart,
    handleAnswer,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

