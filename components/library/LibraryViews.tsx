'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Level, levelData, levelGradients } from '@/data'
import { ChevronRight, Book, Type, ArrowRight } from 'lucide-react'

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

    return (
        <div className="flex flex-col gap-2 p-4 pb-24 min-h-[80vh]">
            {levels.map((level, i) => {
                const isExpanded = expandedLevel === level
                const data = levelData[level]

                return (
                    <motion.div
                        key={level}
                        layout
                        onClick={() => setExpandedLevel(isExpanded ? null : level)}
                        className={`relative rounded-3xl overflow-hidden cursor-pointer shadow-soft transition-all duration-500 ease-spring`}
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
                                <ChevronRight size={20} className="text-text-main opacity-60" />
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
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onNavigate(level, 'word') }}
                                                className="flex flex-col items-center justify-center p-4 bg-white/60 hover:bg-white rounded-2xl gap-2 transition-colors group"
                                            >
                                                <div className="p-3 bg-white rounded-full shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                                                    <Book size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-sm font-bold text-text-main">단어장</span>
                                                    <span className="text-xs text-text-sub">{data.words}개</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onNavigate(level, 'kanji') }}
                                                className="flex flex-col items-center justify-center p-4 bg-white/60 hover:bg-white rounded-2xl gap-2 transition-colors group"
                                            >
                                                <div className="p-3 bg-white rounded-full shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                                    <Type size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-sm font-bold text-text-main">한자 암기</span>
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

                return (
                    <motion.div
                        key={`${item.level}-${item.type}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onNavigate(item.level, item.type)}
                        className="flex items-center py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-50 transition-colors group"
                    >
                        <div className={`w-12 text-lg font-black transition-colors ${getTextColorClass(item.level)}`}>
                            {item.level}
                        </div>
                        <div className="flex-1">
                            <div className="text-base font-bold text-gray-900">
                                {item.type === 'word' ? 'Vocabulary' : 'Kanji'}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                                {count} CARDS
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white group-active:bg-black group-active:border-black group-active:text-white transition-colors">
                            <ArrowRight size={14} className="text-gray-400 group-hover:text-white group-active:text-white" />
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
