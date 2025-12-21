'use client'

import React, { useState } from 'react'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  value?: string
  onChange?: (value: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '검색...',
  onSearch,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sub z-10">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-sub">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m19 19-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/95 backdrop-blur-xl border-2 border-white/50 shadow-lg shadow-black/5 text-body text-text-main placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
      </div>
    </form>
  )
}


