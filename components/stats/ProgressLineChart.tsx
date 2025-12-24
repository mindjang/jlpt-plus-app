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
    <div className="bg-surface rounded-lg shadow-soft p-6">
      <h3 className="text-body font-semibold text-text-main mb-8">{title}</h3>
      <ResponsiveContainer width="100%" className="-ml-12 !w-[calc(100%+3rem)]" height={300}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
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
          <Legend align="center" />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke={LEVEL_COLORS.N3}
            strokeWidth={1.5}
            name="정답률 (%)"
            dot={{ fill: LEVEL_COLORS.N3, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="questions"
            stroke={LEVEL_COLORS.N2}
            strokeWidth={1.5}
            name="문제 수"
            dot={{ fill: LEVEL_COLORS.N2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

