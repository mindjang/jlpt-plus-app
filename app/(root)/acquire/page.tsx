'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar } from '@/components/ui/AppBar'
import { Level } from '@/data'
import {
  LibraryViewSwitcher,
  VisualMode
} from '@/components/library/LibraryViewSwitcher'
import {
  StackLevelView,
  MinimalContentView
} from '@/components/library/LibraryViews'

export default function AcquirePage() {
  const router = useRouter()
  // Default to Stack view
  const [visualMode, setVisualMode] = useState<VisualMode>('stack')

  const handleNavigate = (level: Level, type: 'word' | 'kanji') => {
    router.push(`/acquire/auto-study/${level.toLowerCase()}?type=${type}`)
  }

  const renderContent = () => {
    switch (visualMode) {
      case 'stack': return <StackLevelView onNavigate={handleNavigate} />
      case 'minimal': return <MinimalContentView onNavigate={handleNavigate} />
      default: return <StackLevelView onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="w-full min-h-screen bg-page">
      <AppBar
        title="도서관"
        rightAction={
          <button
            onClick={() => router.push('/stats')}
            className="button-press w-8 h-8 flex items-center justify-center rounded-full hover:bg-page transition-colors"
            aria-label="독서 기록"
          >
            <svg
              className="w-5 h-5 text-text-main"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        }
      />

      <LibraryViewSwitcher
        visualMode={visualMode}
        setVisualMode={setVisualMode}
      />

      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  )
}

