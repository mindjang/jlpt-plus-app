import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Level, levelData, levelGradients } from '@/data'
import { ChevronDown, Book, Type, ArrowRight, Lock } from 'lucide-react'
import { getStudySettings, StudySettings } from '@/lib/firebase/firestore'

// --- Types & Constants & Helpers ---
const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']

const getGradientStyle = (level: Level) => {
    const g = levelGradients[level]
    return {
        background: `linear-gradient(135deg, ${g.from} 0%, ${g.to} 100%)`,
    }
}

const getTextColorClass = (level: Level) => `text-level-${level.toLowerCase()}`

interface ViewProps {
    onNavigate: (level: Level, type: 'word' | 'kanji') => void
}

// --- UI 1: Stack Level View (Interactive Accordion) ---
export const StackLevelView: React.FC<ViewProps> = ({ onNavigate }) => {
    const [expandedLevel, setExpandedLevel] = useState<Level | null>('N5')
    const [settings, setSettings] = useState<StudySettings | null>(null)

    useEffect(() => {
        getStudySettings().then(s => setSettings(s))
    }, [])

    const isEnabled = (level: Level, type: 'word' | 'kanji') => {
        // Default to true if loading or no settings found
        if (!settings) return true
        const s = settings[level]
        if (!s) return true
        return s[type]
    }

    return (
        <div className="flex flex-col gap-4 p-4 pb-24 min-h-[80vh]">
            {levels.map((level, i) => {
                const isExpanded = expandedLevel === level
                const data = levelData[level]

                return (
                    <motion.div
                        key={level}
                        layout
                        onClick={() => setExpandedLevel(isExpanded ? null : level)}
                        className={`relative rounded-lg overflow-hidden cursor-pointer shadow-soft transition-all duration-500 ease-spring`}
                        style={{
                            ...getGradientStyle(level),
                            height: isExpanded ? '280px' : '72px',
                        }}
                    >
                        {/* Collapsed Header */}
                        <motion.div layout="position" className="absolute top-0 left-0 right-0 h-[72px] flex items-center justify-between px-6 z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 font-bold text-text-main shadow-sm">
                                    {level}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-text-main text-lg">
                                        {level === 'N5' ? '입문 단계' :
                                            level === 'N4' ? '기본 단계' :
                                                level === 'N3' ? '응용 단계' :
                                                    level === 'N2' ? '심화 단계' : '완성 단계'}
                                    </span>
                                    {!isExpanded && (
                                        <span className="text-xs text-text-sub opacity-70">클릭해서 펼치기</span>
                                    )}
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center"
                            >
                                <ChevronDown size={20} className="text-text-main opacity-60" />
                            </motion.div>
                        </motion.div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-[72px] left-0 right-0 bottom-0 p-6 flex flex-col justify-end"
                                >
                                    <div className="space-y-3">
                                        <p className="text-text-sub text-sm mb-4 leading-relaxed opacity-80">
                                            꾸준함이 실력이 됩니다. 오늘 배울 내용을 선택해주세요.
                                        </p>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Word Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isEnabled(level, 'word')) onNavigate(level, 'word');
                                                }}
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg gap-2 transition-colors group relative overflow-hidden ${isEnabled(level, 'word')
                                                        ? 'bg-white/60 hover:bg-white'
                                                        : 'bg-white/30 cursor-not-allowed'
                                                    }`}
                                            >
                                                {!isEnabled(level, 'word') && (
                                                    <div className="absolute inset-0 bg-gray-500/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">준비 중</span>
                                                    </div>
                                                )}
                                                <div className={`p-3 bg-white rounded-full shadow-sm text-orange-500 ${isEnabled(level, 'word') ? 'group-hover:scale-110' : 'opacity-50'} transition-transform`}>
                                                    <Book size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <span className={`block text-sm font-bold text-text-main ${!isEnabled(level, 'word') && 'opacity-50'}`}>단어장</span>
                                                    <span className="text-xs text-text-sub">{data.words}개</span>
                                                </div>
                                            </button>

                                            {/* Kanji Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isEnabled(level, 'kanji')) onNavigate(level, 'kanji');
                                                }}
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg gap-2 transition-colors group relative overflow-hidden ${isEnabled(level, 'kanji')
                                                        ? 'bg-white/60 hover:bg-white'
                                                        : 'bg-white/30 cursor-not-allowed'
                                                    }`}
                                            >
                                                {!isEnabled(level, 'kanji') && (
                                                    <div className="absolute inset-0 bg-gray-500/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">준비 중</span>
                                                    </div>
                                                )}
                                                <div className={`p-3 bg-white rounded-full shadow-sm text-blue-500 ${isEnabled(level, 'kanji') ? 'group-hover:scale-110' : 'opacity-50'} transition-transform`}>
                                                    <Type size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <span className={`block text-sm font-bold text-text-main ${!isEnabled(level, 'kanji') && 'opacity-50'}`}>한자 암기</span>
                                                    <span className="text-xs text-text-sub">{data.kanji}개</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
            })}
        </div>
    )
}

// --- UI 2: Minimal Content View (Swiss Style List) ---
export const MinimalContentView: React.FC<ViewProps> = ({ onNavigate }) => {
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

    const items = React.useMemo(() => {
        const arr: { level: Level, type: 'word' | 'kanji' }[] = []
        levels.forEach(level => { arr.push({ level, type: 'word' }); arr.push({ level, type: 'kanji' }) })
        return arr
    }, [])

    return (
        <div className="px-4 pb-24">
            {items.map((item, i) => {
                const data = levelData[item.level]
                const count = item.type === 'word' ? data.words : data.kanji
                const enabled = isEnabled(item.level, item.type)

                return (
                    <motion.div
                        key={`${item.level}-${item.type}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                            if (enabled) onNavigate(item.level, item.type)
                        }}
                        className={`flex items-center py-4 border-b border-gray-100 transition-colors group ${enabled ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-50' : 'opacity-50 cursor-not-allowed bg-gray-50/50'
                            }`}
                    >
                        <div className={`w-12 text-lg font-black transition-colors ${getTextColorClass(item.level)}`}>
                            {item.level}
                        </div>
                        <div className="flex-1">
                            <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                                {item.type === 'word' ? 'Vocabulary' : 'Kanji'}
                                {!enabled && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">준비 중</span>}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                                {count} CARDS
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-colors ${enabled
                                ? 'group-hover:bg-black group-hover:border-black group-hover:text-white group-active:bg-black group-active:border-black group-active:text-white'
                                : ''
                            }`}>
                            {enabled ? (
                                <ArrowRight size={14} className="text-gray-400 group-hover:text-white group-active:text-white" />
                            ) : (
                                <Lock size={14} className="text-gray-300" />
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
