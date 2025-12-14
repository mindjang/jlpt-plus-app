'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getCurrentUser } from '@/lib/firebase/auth'
import type { NaverWord, KanjiAliveEntry, ExampleItem, Level } from '@/data/types'

interface ContentEditModalProps {
  isOpen: boolean
  onClose: () => void
  level: Level
  type: 'word' | 'kanji' | 'example'
  item?: NaverWord | KanjiAliveEntry | { entry: string; example: ExampleItem }
  onSave: () => void
}

export function ContentEditModal({
  isOpen,
  onClose,
  level,
  type,
  item,
  onSave,
}: ContentEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 단어 폼 상태
  const [wordEntry, setWordEntry] = useState('')
  const [wordKanji, setWordKanji] = useState('')
  const [wordLevel, setWordLevel] = useState('')
  const [wordPartsMeans, setWordPartsMeans] = useState<Array<{ part: string; means: string[] }>>([{ part: '', means: [''] }])

  // 한자 폼 상태
  const [kanjiCharacter, setKanjiCharacter] = useState('')
  const [kanjiMeaning, setKanjiMeaning] = useState('')
  const [kanjiOnyomi, setKanjiOnyomi] = useState('')
  const [kanjiKunyomi, setKanjiKunyomi] = useState('')

  // 예문 폼 상태
  const [exampleEntry, setExampleEntry] = useState('')
  const [exampleJapanese, setExampleJapanese] = useState('')
  const [exampleKorean, setExampleKorean] = useState('')
  const [exampleRank, setExampleRank] = useState('1')

  const isEditMode = !!item

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (item) {
      if (type === 'word') {
        const word = item as NaverWord
        setWordEntry(word.entry || '')
        setWordKanji(word.kanji || '')
        setWordLevel(word.level || '')
        setWordPartsMeans(
          word.partsMeans?.map(pm => ({ part: pm.part || '', means: pm.means || [''] })) || 
          [{ part: '', means: [''] }]
        )
      } else if (type === 'kanji') {
        const kanji = item as KanjiAliveEntry
        setKanjiCharacter(kanji.ka_utf || kanji.kanji?.character || '')
        setKanjiMeaning(kanji.kanji?.meaning?.korean || kanji.kanji?.meaning?.english || kanji.meaning || '')
        setKanjiOnyomi(kanji.kanji?.onyomi?.katakana || kanji.onyomi_ja || '')
        setKanjiKunyomi(kanji.kanji?.kunyomi?.hiragana || kanji.kunyomi_ja || '')
      } else if (type === 'example') {
        const exampleData = item as { entry: string; example: ExampleItem }
        setExampleEntry(exampleData.entry || '')
        setExampleJapanese(exampleData.example.expExample1.replace(/<[^>]+>/g, '') || '')
        setExampleKorean(exampleData.example.expExample2 || '')
        setExampleRank(exampleData.example.rank || '1')
      }
    } else {
      // 새 항목 추가 모드 - 초기화
      setWordEntry('')
      setWordKanji('')
      setWordLevel(level.replace('N', ''))
      setWordPartsMeans([{ part: '', means: [''] }])
      setKanjiCharacter('')
      setKanjiMeaning('')
      setKanjiOnyomi('')
      setKanjiKunyomi('')
      setExampleEntry('')
      setExampleJapanese('')
      setExampleKorean('')
      setExampleRank('1')
    }
  }, [item, type, level])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const user = getCurrentUser()
      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      const token = await user.getIdToken()

      if (type === 'word') {
        if (!wordEntry || !wordPartsMeans[0]?.means[0]) {
          setError('단어와 의미는 필수입니다.')
          return
        }

        const wordData: NaverWord = {
          entry_id: isEditMode ? (item as NaverWord).entry_id : `manual-${Date.now()}`,
          origin_entry_id: isEditMode ? (item as NaverWord).origin_entry_id : `manual-${Date.now()}`,
          entry: wordEntry,
          kanji: wordKanji || undefined,
          level: wordLevel || level.replace('N', ''),
          source: isEditMode ? (item as NaverWord).source : 'manual',
          partsMeans: wordPartsMeans.filter(pm => pm.part && pm.means.length > 0 && pm.means[0]),
          category1: 'jlpt',
          category2: wordEntry,
          category3: null,
        }

        const endpoint = `/api/admin/content/words`
        const method = isEditMode ? 'PUT' : 'POST'

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level,
            entryId: isEditMode ? (item as NaverWord).entry_id : undefined,
            word: wordData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '저장에 실패했습니다.')
        }
      } else if (type === 'kanji') {
        if (!kanjiCharacter || !kanjiMeaning) {
          setError('한자와 의미는 필수입니다.')
          return
        }

        const kanjiData: Partial<KanjiAliveEntry> = {
          ka_utf: kanjiCharacter,
          kanji: {
            character: kanjiCharacter,
            meaning: {
              korean: kanjiMeaning,
              english: kanjiMeaning,
            },
            onyomi: {
              romaji: '',
              katakana: kanjiOnyomi || '',
            },
            kunyomi: {
              romaji: '',
              hiragana: kanjiKunyomi || '',
            },
            strokes: {
              count: 0,
              timings: [],
              images: [],
            },
            video: {
              poster: '',
              mp4: '',
              webm: '',
            },
          },
          meaning: kanjiMeaning,
          onyomi_ja: kanjiOnyomi,
          kunyomi_ja: kanjiKunyomi,
        }

        const endpoint = `/api/admin/content/kanji`
        const method = isEditMode ? 'PUT' : 'POST'

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level,
            character: isEditMode ? kanjiCharacter : undefined,
            kanji: kanjiData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '저장에 실패했습니다.')
        }
      } else if (type === 'example') {
        if (!exampleEntry || !exampleJapanese || !exampleKorean) {
          setError('단어, 일본어 예문, 한국어 예문은 필수입니다.')
          return
        }

        const exampleData: ExampleItem = {
          rank: exampleRank,
          exampleLangCode: 'JAKO',
          example1Lang: 1,
          expExample1: exampleJapanese,
          example2Lang: '2',
          expExample2: exampleKorean,
          expEntry: exampleEntry,
        }

        const endpoint = `/api/admin/content/examples`
        const method = isEditMode ? 'PUT' : 'POST'

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level,
            entry: exampleEntry,
            exampleRank: isEditMode ? (item as { entry: string; example: ExampleItem }).example.rank : undefined,
            example: exampleData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '저장에 실패했습니다.')
        }
      }

      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const addMeaning = () => {
    if (type === 'word') {
      setWordPartsMeans([...wordPartsMeans, { part: '', means: [''] }])
    }
  }

  const removeMeaning = (index: number) => {
    if (type === 'word' && wordPartsMeans.length > 1) {
      setWordPartsMeans(wordPartsMeans.filter((_, i) => i !== index))
    }
  }

  const addMeanToPart = (partIndex: number) => {
    if (type === 'word') {
      const updated = [...wordPartsMeans]
      updated[partIndex].means.push('')
      setWordPartsMeans(updated)
    }
  }

  const updatePartMean = (partIndex: number, meanIndex: number, value: string) => {
    if (type === 'word') {
      const updated = [...wordPartsMeans]
      updated[partIndex].means[meanIndex] = value
      setWordPartsMeans(updated)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditMode ? '수정' : '추가'}: ${level} ${type === 'word' ? '단어' : type === 'kanji' ? '한자' : '예문'}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded text-label">
            {error}
          </div>
        )}

        {type === 'word' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                단어 (히라가나) *
              </label>
              <input
                type="text"
                value={wordEntry}
                onChange={(e) => setWordEntry(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="あき"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                한자 (선택사항)
              </label>
              <input
                type="text"
                value={wordKanji}
                onChange={(e) => setWordKanji(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="秋"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                레벨
              </label>
              <input
                type="text"
                value={wordLevel}
                onChange={(e) => setWordLevel(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-2">
                품사 및 의미 *
              </label>
              {wordPartsMeans.map((pm, partIndex) => (
                <div key={partIndex} className="mb-4 p-3 bg-page border border-divider rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={pm.part}
                      onChange={(e) => {
                        const updated = [...wordPartsMeans]
                        updated[partIndex].part = e.target.value
                        setWordPartsMeans(updated)
                      }}
                      className="flex-1 px-3 py-2 border border-divider rounded text-body"
                      placeholder="품사 (예: 명사)"
                    />
                    {wordPartsMeans.length > 1 && (
                      <button
                        onClick={() => removeMeaning(partIndex)}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded text-label"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {pm.means.map((mean, meanIndex) => (
                      <div key={meanIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={mean}
                          onChange={(e) => updatePartMean(partIndex, meanIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-divider rounded text-body"
                          placeholder="의미"
                        />
                        {pm.means.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = [...wordPartsMeans]
                              updated[partIndex].means = updated[partIndex].means.filter((_, i) => i !== meanIndex)
                              setWordPartsMeans(updated)
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addMeanToPart(partIndex)}
                      className="text-label text-primary"
                    >
                      + 의미 추가
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addMeaning}
                className="text-label text-primary"
              >
                + 품사 추가
              </button>
            </div>
          </div>
        ) : type === 'kanji' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                한자 *
              </label>
              <input
                type="text"
                value={kanjiCharacter}
                onChange={(e) => setKanjiCharacter(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body text-2xl"
                placeholder="人"
                maxLength={1}
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                의미 *
              </label>
              <input
                type="text"
                value={kanjiMeaning}
                onChange={(e) => setKanjiMeaning(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="사람"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                음독 (온요미)
              </label>
              <input
                type="text"
                value={kanjiOnyomi}
                onChange={(e) => setKanjiOnyomi(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="ジン、ニン"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                훈독 (쿤요미)
              </label>
              <input
                type="text"
                value={kanjiKunyomi}
                onChange={(e) => setKanjiKunyomi(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="ひと"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                단어 (히라가나) *
              </label>
              <input
                type="text"
                value={exampleEntry}
                onChange={(e) => setExampleEntry(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="あき"
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-label text-text-sub mt-1">단어는 수정할 수 없습니다.</p>
              )}
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                일본어 예문 *
              </label>
              <textarea
                value={exampleJapanese}
                onChange={(e) => setExampleJapanese(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="秋が来ました。"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                한국어 예문 *
              </label>
              <textarea
                value={exampleKorean}
                onChange={(e) => setExampleKorean(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="가을이 왔습니다."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-body font-medium text-text-main mb-1">
                순위 (Rank)
              </label>
              <input
                type="text"
                value={exampleRank}
                onChange={(e) => setExampleRank(e.target.value)}
                className="w-full px-4 py-2 border border-divider rounded-lg text-body"
                placeholder="1"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-page border border-divider rounded-lg text-body font-medium active:bg-gray-50"
            disabled={saving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg text-body font-medium active:bg-primary/90"
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
