'use client'

import React from 'react'
import { RainItem } from './useRainGame'

interface Props {
  items: RainItem[]
  activeId: string | null
}

export function RainRenderer({ items, activeId }: Props) {
  return (
    <div className="relative w-full h-[520px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b0f1a] via-[#0f172a] to-[#0b0f1a] border border-white/5 shadow-lg shadow-black/30">
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* falling words */}
      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute text-lg font-black tracking-wide px-3 py-1 rounded-full shadow-lg transition-transform duration-150 ${
            activeId === item.id
              ? 'text-[#7CF4FF] bg-white/10 border border-[#7CF4FF]/50'
              : 'text-[#FFD479] bg-white/5 border border-white/10'
          }`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: activeId === item.id ? '0 0 18px rgba(124, 244, 255, 0.5)' : '0 0 12px rgba(255, 212, 121, 0.3)',
          }}
        >
          {item.text}
        </div>
      ))}
      {/* ground */}
      <div className="absolute left-0 right-0 bottom-4 h-1 bg-gradient-to-r from-transparent via-[#ff8a00] to-transparent blur-[1px]" />
    </div>
  )
}

