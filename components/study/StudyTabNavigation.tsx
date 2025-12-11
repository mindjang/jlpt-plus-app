'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faLanguage } from '@fortawesome/free-solid-svg-icons'

interface StudyTabNavigationProps {
  activeTab: 'word' | 'kanji'
  onTabChange: (tab: 'word' | 'kanji') => void
}

export function StudyTabNavigation({
  activeTab,
  onTabChange,
}: StudyTabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-surface border-t border-divider z-30">
      <div className="flex">
        <button
          onClick={() => onTabChange('word')}
          className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative ${
            activeTab === 'word' ? 'text-orange-500' : 'text-text-sub'
          }`}
        >
          <FontAwesomeIcon icon={faBook} className="text-[1.25rem] mb-1" />
          <span className="text-label">단어</span>
          {activeTab === 'word' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => onTabChange('kanji')}
          className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative ${
            activeTab === 'kanji' ? 'text-orange-500' : 'text-text-sub'
          }`}
        >
          <FontAwesomeIcon icon={faLanguage} className="text-[1.25rem] mb-1" />
          <span className="text-label">한자</span>
          {activeTab === 'kanji' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          )}
        </button>
      </div>
    </div>
  )
}
