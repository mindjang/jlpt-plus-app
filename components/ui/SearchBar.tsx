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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-hint">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m19 19-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 rounded-search bg-surface border border-divider text-body text-text-main placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all"
        />
      </div>
    </form>
  )
}


