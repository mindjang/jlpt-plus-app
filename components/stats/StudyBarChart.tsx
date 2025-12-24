'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface BarChartData {
  name: string
  word: number
  kanji: number
}

interface StudyBarChartProps {
  data: BarChartData[]
  period: 'week' | 'month' | 'year'
}

export function StudyBarChart({ data, period }: StudyBarChartProps) {
  const getTitle = () => {
    switch (period) {
      case 'week':
        return '주간 학습량'
      case 'month':
        return '월간 학습량'
      case 'year':
        return '연간 학습량'
    }
  }

  return (
    <div className="bg-surface rounded-lg shadow-soft p-6">
      <h3 className="text-body font-semibold text-text-main mb-8">{getTitle()}</h3>
      <ResponsiveContainer width="100%" height={300} className="-ml-12 !w-[calc(100%+3rem)]">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="word" fill={LEVEL_COLORS.N5} name="단어" radius={[4, 4, 0, 0]} />
          <Bar dataKey="kanji" fill={LEVEL_COLORS.N4} name="한자" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

