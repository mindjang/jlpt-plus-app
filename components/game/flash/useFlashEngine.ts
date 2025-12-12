import { useState, useEffect, useRef } from 'react'
import { Level } from '@/data'
import { getNaverWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji'

export type GameState = 'playing' | 'paused' | 'gameover'

export interface QuizItem {
  text: string
  subText?: string
  answer: string
}

export function useFlashEngine(level: Level, mode: 'word' | 'kanji') {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [currentItem, setCurrentItem] = useState<QuizItem | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0) // 연속 정답
  const [maxStreak, setMaxStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(3000) // 3초 (ms)
  const [questionCount, setQuestionCount] = useState(0)
  const [totalQuestions] = useState(20) // 총 20문제

  const poolRef = useRef<QuizItem[]>([])
  const usedIndices = useRef<Set<number>>(new Set())
  const timerRef = useRef<number>()
  const gameStateRef = useRef<GameState>('playing')

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Initialize Data
  useEffect(() => {
    let data: QuizItem[] = []
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
      data = getKanjiByLevel(level)
        .filter(k => k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning) // undefined 제거
        .map((k) => ({
          text: k.kanji?.character || k.ka_utf,
          subText: shortReading(k.kanji?.kunyomi?.hiragana || k.kunyomi_ja),
          answer: (k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning)!,
        }))
    }
    poolRef.current = data.sort(() => Math.random() - 0.5)
    usedIndices.current.clear()

    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setQuestionCount(0)
    setGameState('playing')

    nextQuestion()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [level, mode])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 50 // 50ms씩 감소
        if (newTime <= 0) {
          handleTimeout()
          return 3000
        }
        return newTime
      })
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState, currentItem])

  const nextQuestion = () => {
    if (questionCount >= totalQuestions) {
      setGameState('gameover')
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    // 사용하지 않은 문제 선택
    let index = Math.floor(Math.random() * poolRef.current.length)
    let attempts = 0
    while (usedIndices.current.has(index) && attempts < 100) {
      index = Math.floor(Math.random() * poolRef.current.length)
      attempts++
    }

    if (attempts >= 100) {
      // 모든 문제를 사용했으면 리셋
      usedIndices.current.clear()
      index = Math.floor(Math.random() * poolRef.current.length)
    }

    usedIndices.current.add(index)
    const item = poolRef.current[index]
    setCurrentItem(item)

    // 보기 생성
    const pool = poolRef.current
      .filter(i => i.answer && i.answer !== item.answer)
      .map(i => i.answer)

    const uniquePool = Array.from(new Set(pool))
    const distractors: string[] = []
    while (distractors.length < 3 && uniquePool.length > 0) {
      const pick = uniquePool.splice(Math.floor(Math.random() * uniquePool.length), 1)[0]
      if (pick) distractors.push(pick)
    }

    const newOptions = [item.answer, ...distractors].slice(0, 4).sort(() => Math.random() - 0.5)
    setOptions(newOptions)
    setTimeLeft(3000)
    setQuestionCount(prev => prev + 1)
  }

  const handleAnswer = (selectedAnswer: string) => {
    if (gameState !== 'playing' || !currentItem) return

    if (selectedAnswer === currentItem.answer) {
      // Correct!
      const timeBonus = Math.floor(timeLeft / 100) // 남은 시간에 따라 보너스
      const streakBonus = streak * 5 // 연속 정답 보너스
      const earnedPoints = 10 + timeBonus + streakBonus

      setScore(s => s + earnedPoints)
      setStreak(s => {
        const newStreak = s + 1
        setMaxStreak(max => Math.max(max, newStreak))
        return newStreak
      })
    } else {
      // Wrong!
      setStreak(0)
    }

    nextQuestion()
  }

  const handleTimeout = () => {
    // 시간 초과
    setStreak(0)
    nextQuestion()
  }

  const restartGame = () => {
    usedIndices.current.clear()
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setQuestionCount(0)
    setGameState('playing')
    nextQuestion()
  }

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }

  return {
    gameState,
    currentItem,
    options,
    score,
    streak,
    maxStreak,
    timeLeft,
    questionCount,
    totalQuestions,
    handleAnswer,
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
