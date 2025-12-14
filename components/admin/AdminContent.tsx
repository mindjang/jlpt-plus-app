'use client'

import React, { useState, useEffect } from 'react'
import { getStudySettings, updateStudySettings, StudySettings } from '@/lib/firebase/firestore'
import { Level } from '@/data'
import { handleFirestoreError } from '@/lib/utils/error/errorHandler'
import { ContentViewer } from './ContentViewer'

const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function AdminContent() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<StudySettings>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Viewer State
  const [viewer, setViewer] = useState<{ isOpen: boolean; level: string; type: 'word' | 'kanji' }>({
    isOpen: false,
    level: 'N5',
    type: 'word'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getStudySettings()
      if (data) {
        setSettings(data)
      } else {
        const initial: StudySettings = {}
        levels.forEach(l => {
          initial[l] = { word: true, kanji: true }
        })
        setSettings(initial)
      }
    } catch (error) {
      handleFirestoreError(error, '설정 로드')
      setMessage({ type: 'error', text: '설정을 로드하는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (level: string, type: 'word' | 'kanji') => {
    const current = settings[level] || { word: true, kanji: true }
    const next = {
      ...settings,
      [level]: {
        ...current,
        [type]: !current[type]
      }
    }

    setSettings(next)

    // Auto save
    try {
      setSaving(true)
      await updateStudySettings(next)
    } catch (error) {
      handleFirestoreError(error, '설정 저장')
      setMessage({ type: 'error', text: '자동 저장 실패' })
    } finally {
      setSaving(false)
    }
  }

  const openViewer = (level: string, type: 'word' | 'kanji') => {
    setViewer({ isOpen: true, level, type })
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="space-y-6">
      {saving && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-label">
          저장 중...
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-body ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {levels.map((level) => {
          const setting = settings[level] || { word: true, kanji: true }

          return (
            <div key={level} className="bg-page rounded-lg p-5 border border-divider">
              <div className="flex items-center justify-between mb-4">
                <span className="text-subtitle font-semibold text-text-main">{level}</span>
                <span className="text-label text-text-sub bg-white px-2 py-1 rounded border border-divider">
                  {level === 'N5' ? '입문' : level === 'N4' ? '기본' : level === 'N3' ? '응용' : level === 'N2' ? '심화' : '완성'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Word Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-body font-medium text-text-main">단어장</span>
                    <span className="text-label text-text-sub">학습 가능 여부</span>
                  </div>
                  <button
                    onClick={() => handleToggle(level, 'word')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.word ? 'bg-primary' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.word ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Kanji Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-body font-medium text-text-main">한자 암기</span>
                    <span className="text-label text-text-sub">학습 가능 여부</span>
                  </div>
                  <button
                    onClick={() => handleToggle(level, 'kanji')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.kanji ? 'bg-primary' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.kanji ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="pt-2 border-t border-divider flex gap-2">
                  <button
                    onClick={() => openViewer(level, 'word')}
                    className="flex-1 py-2 px-3 text-label font-medium text-text-main bg-white border border-divider rounded active:bg-gray-50"
                  >
                    단어 목록
                  </button>
                  <button
                    onClick={() => openViewer(level, 'kanji')}
                    className="flex-1 py-2 px-3 text-label font-medium text-text-main bg-white border border-divider rounded active:bg-gray-50"
                  >
                    한자 목록
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ContentViewer
        isOpen={viewer.isOpen}
        onClose={() => setViewer(prev => ({ ...prev, isOpen: false }))}
        level={viewer.level}
        type={viewer.type}
      />
    </div>
  )
}
