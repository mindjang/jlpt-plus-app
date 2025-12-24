import { useState, useEffect, useRef } from 'react'
import { Level } from '@/data'
import { getNaverWordsByLevelAsync } from '@/data/words/index'
import { getKanjiByLevelAsync } from '@/data/kanji'
import { recordGameResult } from '@/lib/stats/calculator'

export type GameState = 'playing' | 'paused' | 'complete'

export interface Card {
  id: number
  pairId: number // 같은 쌍은 같은 pairId
  content: string
  type: 'question' | 'answer' // 문제 or 정답
  isFlipped: boolean
  isMatched: boolean
}

export function useMatchEngine(
  level: Level,
  mode: 'word' | 'kanji',
  difficulty: 'easy' | 'medium' | 'hard'
) {
  const [gameState, setGameState] = useState<GameState>('playing')
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [canFlip, setCanFlip] = useState(true)
  const [restartCount, setRestartCount] = useState(0)

  const timerRef = useRef<number>()
  const gameStateRef = useRef<GameState>('playing')
  const totalPairs = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8

  useEffect(() => {
    gameStateRef.current = gameState
    
    // 게임 완료 시 통계 기록
    if (gameState === 'complete') {
      recordGameResult({
        gameType: 'match',
        level,
        mode,
        score: 0, // Match는 점수 없음
        time: timeElapsed,
        moves,
        difficulty,
        timestamp: Date.now(),
      })
    }
  }, [gameState, level, mode, timeElapsed, moves, difficulty])

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  // Initialize Cards
  useEffect(() => {
    const loadData = async () => {
      let data: { question: string; answer: string }[] = []

      if (mode === 'word') {
        const naverWords = await getNaverWordsByLevelAsync(level)
        const filtered = naverWords
          .filter(w => w.partsMeans && w.partsMeans.length > 0 && w.partsMeans[0].means && w.partsMeans[0].means.length > 0)
          .sort(() => Math.random() - 0.5)
          .slice(0, totalPairs)

        data = filtered.map(w => {
          // 첫 번째 part의 첫 번째 의미 사용
          const firstMean = w.partsMeans[0].means[0]
          return {
            question: w.entry,
            answer: firstMean.split(';')[0].trim()
          }
        })
      } else {
        const kanji = await getKanjiByLevelAsync(level)
        const filtered = kanji
          .filter(k => k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, totalPairs)

        data = filtered.map(k => ({
          question: k.kanji?.character || k.ka_utf,
          answer: (k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning)!.split(',')[0]
        }))
      }

      // 데이터가 없으면 게임 시작하지 않음
      if (data.length === 0) {
        console.warn('[MatchGame] No data available for', level, mode)
        return
      }

      // 카드 생성 (문제 + 답 쌍)
      const newCards: Card[] = []
      data.forEach((item, index) => {
        newCards.push({
          id: index * 2,
          pairId: index,
          content: item.question,
          type: 'question',
          isFlipped: false,
          isMatched: false
        })
        newCards.push({
          id: index * 2 + 1,
          pairId: index,
          content: item.answer,
          type: 'answer',
          isFlipped: false,
          isMatched: false
        })
      })

      // 카드 섞기
      const shuffled = newCards.sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setFlippedCards([])
      setMatchedPairs(0)
      setMoves(0)
      setTimeElapsed(0)
      setGameState('playing')
    }

    loadData()
  }, [level, mode, difficulty, restartCount])

  const handleCardClick = (cardId: number) => {
    if (!canFlip) return

    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    // 카드 뒤집기
    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    // 2장이 뒤집혔을 때
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      setCanFlip(false)

      const [firstId, secondId] = newFlipped
      const firstCard = cards.find(c => c.id === firstId)
      const secondCard = cards.find(c => c.id === secondId)

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // 매칭 성공!
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.pairId === firstCard.pairId ? { ...c, isMatched: true } : c
          ))
          setMatchedPairs(prev => {
            const newMatched = prev + 1
            if (newMatched === totalPairs) {
              setGameState('complete')
              if (timerRef.current) clearInterval(timerRef.current)
            }
            return newMatched
          })
          setFlippedCards([])
          setCanFlip(true)
        }, 500)
      } else {
        // 매칭 실패
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ))
          setFlippedCards([])
          setCanFlip(true)
        }, 1000)
      }
    }
  }

  const restartGame = () => {
    setCards([])
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setTimeElapsed(0)
    setCanFlip(true)
    setGameState('playing')
    gameStateRef.current = 'playing'
    // trigger data reload
    setRestartCount(prev => prev + 1)
  }

  const togglePause = () => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused')
      gameStateRef.current = 'paused'
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing')
      gameStateRef.current = 'playing'
    }
  }

  return {
    gameState,
    cards,
    matchedPairs,
    totalPairs,
    moves,
    timeElapsed,
    handleCardClick,
    togglePause,
    restartGame
  }
}
