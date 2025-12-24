'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { LEVEL_COLORS } from '@/lib/constants/colors'

interface PieChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface CategoryPieChartProps {
  data: PieChartData[]
  title?: string
}

// 레벨 색상을 순환 사용 (N1부터 N5까지)
const COLORS = [
  LEVEL_COLORS.N1,
  LEVEL_COLORS.N2,
  LEVEL_COLORS.N3,
  LEVEL_COLORS.N4,
  LEVEL_COLORS.N5,
]

export function CategoryPieChart({ data, title = '카테고리별 분포' }: CategoryPieChartProps) {
  return (
    <div className="bg-surface rounded-lg shadow-soft p-6">
      <h3 className="text-body font-semibold text-text-main mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

