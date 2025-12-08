declare module 'react-calendar-heatmap' {
  import { Component } from 'react'

  export interface CalendarHeatmapValue {
    date: string
    count: number
    level?: string
  }

  export interface CalendarHeatmapProps {
    startDate: Date
    endDate: Date
    values: CalendarHeatmapValue[]
    classForValue?: (value: CalendarHeatmapValue | null) => string
    tooltipDataAttrs?: (value: CalendarHeatmapValue | null) => Record<string, string | undefined>
    showWeekdayLabels?: boolean
    weekdayLabels?: string[]
    monthLabels?: string[]
    gutterSize?: number
    squareSize?: number
    onClick?: (value: CalendarHeatmapValue | null) => void
    onMouseOver?: (e: React.MouseEvent, value: CalendarHeatmapValue | null) => void
    onMouseLeave?: (e: React.MouseEvent, value: CalendarHeatmapValue | null) => void
  }

  export default class CalendarHeatmap extends Component<CalendarHeatmapProps> {}
}

