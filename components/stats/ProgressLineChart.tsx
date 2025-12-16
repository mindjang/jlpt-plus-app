'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface LineChartData {
  date: string
  accuracy: number
  questions: number
}

interface ProgressLineChartProps {
  data: LineChartData[]
  title?: string
}

export function ProgressLineChart({ data, title = '학습 추이' }: ProgressLineChartProps) {
  return (
    <div className="bg-surface rounded-lg border border-divider p-6">
      <h3 className="text-body font-semibold text-text-main mb-8">{title}</h3>
      <ResponsiveContainer width="100%" className="-ml-8 w-[calc(100%+2rem)]" height={300}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
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
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke={LEVEL_COLORS.N3}
            strokeWidth={2}
            name="정답률 (%)"
            dot={{ fill: LEVEL_COLORS.N3, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="questions"
            stroke={LEVEL_COLORS.N2}
            strokeWidth={2}
            name="문제 수"
            dot={{ fill: LEVEL_COLORS.N2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

