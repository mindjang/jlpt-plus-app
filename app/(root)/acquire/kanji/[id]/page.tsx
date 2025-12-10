'use client'

import React, { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { LevelChip } from '@/components/ui/LevelChip'
import { getKanjiEntry, getKanjiLevel, searchKanji } from '@/data/kanji/index'
import {
  getKanjiCharacter,
  getOnYomi,
  getKunYomi,
  getRadical,
  getStrokeCount,
  getRelatedWords,
  getKanjiMeaning,
} from '@/lib/utils/kanjiHelpers'
import { motion } from 'framer-motion'

export default function KanjiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const kanji = decodeURIComponent(params.id as string)

  // 데이터에서 가져오기
  const kanjiEntry = getKanjiEntry(kanji)

  if (!kanjiEntry) {
    return (
      <div className="w-full">
        <AppBar
          title="한자 상세"
          onBack={() => router.back()}
        />
        <div className="p-4">
          <div className="bg-surface rounded-card p-6 text-center">
            <p className="text-body text-text-sub">한자를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  // 레벨 찾기
  const level = getKanjiLevel(kanji) || 'N5'
  const character = getKanjiCharacter(kanjiEntry)
  const onYomi = getOnYomi(kanjiEntry)
  const kunYomi = getKunYomi(kanjiEntry)
  const radical = getRadical(kanjiEntry)
  const strokeCount = getStrokeCount(kanjiEntry)
  const relatedWords = getRelatedWords(kanjiEntry, level)
  const meaning = getKanjiMeaning(kanjiEntry)

  // 유사 한자 찾기 (같은 부수를 가진 한자, 최대 5개)
  const similarKanji = useMemo(() => {
    if (!radical) return []
    const allKanji = searchKanji('')
    return allKanji
      .filter((entry) => {
        const entryChar = getKanjiCharacter(entry)
        const entryRadical = getRadical(entry)
        return entryChar !== character && entryRadical === radical
      })
      .slice(0, 5)
      .map((entry) => ({
        character: getKanjiCharacter(entry),
        level: getKanjiLevel(getKanjiCharacter(entry)) || 'N5',
        meaning: getKanjiMeaning(entry),
        onYomi: getOnYomi(entry),
        kunYomi: getKunYomi(entry),
        radical: getRadical(entry),
      }))
  }, [radical, character])

  // 한자 구성 요소 (부수와 기본 구성)
  const components = useMemo(() => {
    const comps: Array<{ char: string; type: 'component' | 'radical'; meaning?: string }> = []
    
    // 부수 추가
    if (radical) {
      comps.push({
        char: radical,
        type: 'radical',
        meaning: kanjiEntry.radical?.meaning?.korean || kanjiEntry.radical?.meaning?.english,
      })
    }
    
    // 한자를 구성하는 다른 요소들 (간단한 추정)
    // 실제로는 decomposition 데이터가 필요하지만, 일단 부수만 표시
    return comps
  }, [radical, kanjiEntry])

  return (
    <div className="w-full">
      <AppBar
        title={character}
        onBack={() => router.back()}
      />

      <div className="p-4 space-y-4">
        {/* 상단 획순 버튼 */}
        {strokeCount && (
          <div className="flex justify-end">
            <button
              onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(kanji)}/stroke-order`)}
              className="button-press px-4 py-2 rounded-card bg-surface border border-divider text-body text-text-main font-medium hover:bg-page transition-colors flex items-center gap-2"
            >
              <span>{character} 획순</span>
              <span>›</span>
            </button>
          </div>
        )}

        {/* 한자 기본 정보 */}
        <div className="bg-surface rounded-card p-6">
          <div className="text-center mb-6">
            <h1 className="text-display-l text-jp font-medium text-text-main mb-4">
              {character}
            </h1>
            <LevelChip level={level} />
            <div className="text-title text-text-main font-semibold mt-2">
              {meaning}
            </div>
          </div>

          {/* 음독/훈독 */}
          <div className="space-y-3 mb-6">
            {onYomi.length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">음독</span>
                <span className="text-label text-jp text-text-main">
                  {onYomi.join('、')}
                </span>
              </div>
            )}
            {kunYomi.length > 0 && (
              <div>
                <span className="text-label text-text-sub mr-2">훈독</span>
                <span className="text-label text-jp text-text-main">
                  {kunYomi.join('、')}
                </span>
              </div>
            )}
            {radical && (
              <div>
                <span className="text-label text-text-sub mr-2">부수</span>
                <span className="text-label text-jp text-text-main">
                  {radical}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 한자 구성 */}
        {components.length > 0 && (
          <div className="bg-surface rounded-card p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              한자 구성
            </h3>
            <div className="space-y-2">
              {components.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-card bg-page border border-divider"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-subtitle text-jp font-medium text-text-main">
                      {comp.char}
                    </span>
                    {comp.meaning && (
                      <span className="text-label text-text-sub">{comp.meaning}</span>
                    )}
                  </div>
                  {comp.type === 'radical' && (
                    <span className="px-2 py-1 rounded-chip bg-chip-radical text-chip-text text-label text-xs">
                      부수
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 활용 단어 */}
        {relatedWords.length > 0 && (
          <div className="bg-surface rounded-card p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              활용 단어 ({relatedWords.length})
            </h3>
            <div className="space-y-2">
              {relatedWords.slice(0, 5).map((word, index) => (
                <motion.div
                  key={index}
                  className="bg-page rounded-card p-4 border border-divider"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-subtitle text-jp font-medium text-text-main">
                      {word.word}
                    </span>
                    {word.furigana && (
                      <span className="text-label text-jp text-text-sub">
                        {word.furigana}
                      </span>
                    )}
                  </div>
                  <p className="text-body text-text-sub">{word.meaning}</p>
                </motion.div>
              ))}
              {relatedWords.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-label text-text-sub">
                    더보기 ({relatedWords.length - 5}/{relatedWords.length}) ˅
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 유사 한자 */}
        {similarKanji.length > 0 && (
          <div className="bg-surface rounded-card p-6">
            <h3 className="text-subtitle font-medium text-text-main mb-4">
              유사 한자 ({similarKanji.length})
            </h3>
            <div className="space-y-3">
              {similarKanji.map((item, index) => (
                <div
                  key={index}
                  className="bg-page rounded-card p-4 border border-divider"
                  onClick={() => router.push(`/acquire/kanji/${encodeURIComponent(item.character)}`)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-display-m text-jp font-medium text-text-main">
                      {item.character}
                    </span>
                    <LevelChip level={item.level} />
                    <span className="text-label text-text-main flex-1">
                      {item.meaning}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {item.onYomi && item.onYomi.length > 0 && (
                      <div>
                        <span className="text-label text-text-sub mr-2">음독</span>
                        <span className="text-label text-jp text-text-main">
                          {item.onYomi.join('、')}
                        </span>
                      </div>
                    )}
                    {item.kunYomi && item.kunYomi.length > 0 && (
                      <div>
                        <span className="text-label text-text-sub mr-2">훈독</span>
                        <span className="text-label text-jp text-text-main">
                          {item.kunYomi.join('、')}
                        </span>
                      </div>
                    )}
                    {item.radical && (
                      <div>
                        <span className="text-label text-text-sub mr-2">부수</span>
                        <span className="text-label text-jp text-text-main">
                          {item.radical}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 외부 링크 */}
        <div className="bg-surface rounded-card p-6">
          <h3 className="text-subtitle font-medium text-text-main mb-4">
            외부 링크
          </h3>
          <div className="flex gap-3">
            <a
              href={`https://dict.naver.com/search.nhn?query=${encodeURIComponent(kanji)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-press flex-1 px-4 py-3 rounded-card bg-surface border border-divider text-body text-text-main font-medium text-center hover:bg-page transition-colors flex items-center justify-center gap-2"
            >
              <span>네이버 사전</span>
              <span className="text-xs">↗</span>
            </a>
            <a
              href={`https://chat.openai.com/?q=${encodeURIComponent(kanji)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-press flex-1 px-4 py-3 rounded-card bg-surface border border-divider text-body text-text-main font-medium text-center hover:bg-page transition-colors flex items-center justify-center gap-2"
            >
              <span>ChatGPT</span>
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
