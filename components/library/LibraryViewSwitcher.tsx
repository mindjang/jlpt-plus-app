'use client'

import React from 'react'
import { ListCollapse, Scan } from 'lucide-react'

export type VisualMode = 'stack' | 'minimal'

interface LibraryViewSwitcherProps {
    visualMode: VisualMode
    setVisualMode: (mode: VisualMode) => void
}

export const LibraryViewSwitcher: React.FC<LibraryViewSwitcherProps> = ({
    visualMode,
    setVisualMode,
}) => {
    return (
        <div className="px-4 py-3 bg-surface border-b border-divider sticky top-14 z-20">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setVisualMode('stack')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-label font-medium transition-colors ${
                        visualMode === 'stack' 
                            ? 'bg-white text-text-main shadow-sm' 
                            : 'text-text-sub active:bg-gray-200/50'
                    }`}
                >
                    <ListCollapse size={16} />
                    <span>레벨별</span>
                </button>
                <button
                    onClick={() => setVisualMode('minimal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-label font-medium transition-colors ${
                        visualMode === 'minimal' 
                            ? 'bg-white text-text-main shadow-sm' 
                            : 'text-text-sub active:bg-gray-200/50'
                    }`}
                >
                    <Scan size={16} />
                    <span>전체</span>
                </button>
            </div>
        </div>
    )
}
