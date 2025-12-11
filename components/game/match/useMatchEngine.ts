import { useState, useEffect, useRef } from 'react'
import { Level } from '@/data'
import { getWordsByLevel } from '@/data/words/index'
import { getKanjiByLevel } from '@/data/kanji'

export type GameState = 'playing' | 'complete'

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

  const timerRef = useRef<number>()
  const totalPairs = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  // Initialize Cards
  useEffect(() => {
    let data: { question: string; answer: string }[] = []

    if (mode === 'word') {
      const words = getWordsByLevel(level)
        .filter(w => w.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, totalPairs)

      data = words.map(w => ({
        question: w.word,
        answer: w.meaning.split(',')[0]
      }))
    } else {
      const kanji = getKanjiByLevel(level)
        .filter(k => k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, totalPairs)

      data = kanji.map(k => ({
        question: k.kanji?.character || k.ka_utf,
        answer: (k.kanji?.meaning?.korean || k.kanji?.meaning?.english || k.meaning)!.split(',')[0]
      }))
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
  }, [level, mode, difficulty])

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
    // 카드 재생성을 위해 useEffect 트리거
    setCards([])
    setTimeout(() => {
      const event = new Event('restart')
      window.dispatchEvent(event)
    }, 100)
  }

  return {
    gameState,
    cards,
    matchedPairs,
    totalPairs,
    moves,
    timeElapsed,
    handleCardClick,
    restartGame
  }
}
