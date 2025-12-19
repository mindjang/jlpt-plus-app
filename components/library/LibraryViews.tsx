import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Level, levelData } from '@/data'
import { Book, Type, ArrowRight, Lock } from 'lucide-react'
import { getStudySettings, StudySettings } from '@/lib/firebase/firestore'

// --- Types & Constants & Helpers ---
const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const getLevelTitle = (level: Level) => {
    switch (level) {
        case 'N5': return '입문 단계'
        case 'N4': return '기본 단계'
        case 'N3': return '응용 단계'
        case 'N2': return '심화 단계'
        case 'N1': return '완성 단계'
    }
}

interface ViewProps {
    onNavigate: (level: Level, type: 'word' | 'kanji') => void
}

// --- UI 1: Stack Level View (Duolingo Style) ---
export const StackLevelView: React.FC<ViewProps> = ({ onNavigate }) => {
    const [settings, setSettings] = useState<StudySettings | null>(null)

    useEffect(() => {
        getStudySettings().then(s => setSettings(s))
    }, [])

    const isEnabled = (level: Level, type: 'word' | 'kanji') => {
        if (!settings) return true
        const s = settings[level]
        if (!s) return true
        return s[type]
    }

    return (
        <div className="flex flex-col gap-3 p-4 pb-24">
            {levels.map((level, i) => {
                const data = levelData[level]

                return (
                    <motion.div
                        key={level}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-surface rounded-lg border border-divider overflow-hidden"
                    >
                        {/* Level Header */}
                        <div className="p-4 border-b border-divider">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <span className="text-body font-bold text-text-main">{level}</span>
                                </div>
                                <div>
                                    <h3 className="text-body font-semibold text-text-main">
                                        {getLevelTitle(level)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Content Buttons */}
                        <div className="p-4 space-y-2">
                            {/* Word Button */}
                            <button
                                onClick={() => {
                                    if (isEnabled(level, 'word')) onNavigate(level, 'word')
                                }}
                                disabled={!isEnabled(level, 'word')}
                                className={`w-full p-3 bg-surface rounded-lg border border-divider flex items-center justify-between active:bg-gray-50 transition-all ${
                                    !isEnabled(level, 'word')
                                        ? 'opacity-60 cursor-not-allowed'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <Book size={18} className="text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="text-body font-semibold text-text-main">단어장</div>
                                        <div className="text-label text-text-sub">{data.words}개</div>
                                    </div>
                                </div>
                                {isEnabled(level, 'word') ? (
                                    <ArrowRight size={18} className="text-text-sub flex-shrink-0" />
                                ) : (
                                    <Lock size={18} className="text-gray-300 flex-shrink-0" />
                                )}
                            </button>

                            {/* Kanji Button */}
                            <button
                                onClick={() => {
                                    if (isEnabled(level, 'kanji')) onNavigate(level, 'kanji')
                                }}
                                disabled={!isEnabled(level, 'kanji')}
                                className={`w-full p-3 bg-surface rounded-lg border border-divider flex items-center justify-between active:bg-gray-50 transition-all ${
                                    !isEnabled(level, 'kanji')
                                        ? 'opacity-60 cursor-not-allowed'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Type size={18} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="text-body font-semibold text-text-main">한자 암기</div>
                                        <div className="text-label text-text-sub">{data.kanji}개</div>
                                    </div>
                                </div>
                                {isEnabled(level, 'kanji') ? (
                                    <ArrowRight size={18} className="text-text-sub flex-shrink-0" />
                                ) : (
                                    <Lock size={18} className="text-gray-300 flex-shrink-0" />
                                )}
                            </button>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

