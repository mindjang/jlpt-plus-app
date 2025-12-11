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
        <div className="flex flex-col gap-2 px-4 py-2 bg-white/80 backdrop-blur-md sticky top-14 z-20 border-b border-divider">
            <div className="flex bg-gray-100/80 p-1 rounded-lg">
                <button
                    onClick={() => setVisualMode('stack')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${visualMode === 'stack' ? 'bg-white shadow-sm text-text-main scale-100' : 'text-text-sub hover:bg-gray-200/50 scale-95 opacity-70'
                        }`}
                >
                    <ListCollapse size={14} />
                    <span>스택 (레벨별)</span>
                </button>
                <button
                    onClick={() => setVisualMode('minimal')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${visualMode === 'minimal' ? 'bg-white shadow-sm text-text-main scale-100' : 'text-text-sub hover:bg-gray-200/50 scale-95 opacity-70'
                        }`}
                >
                    <Scan size={14} />
                    <span>미니멀 (전체)</span>
                </button>
            </div>
        </div>
    )
}
