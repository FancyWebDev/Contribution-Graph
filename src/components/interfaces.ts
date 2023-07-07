import { DayOfWeek } from "@/components/types"

export interface Value {
  date: Date | string
  count: number
}

export interface Activity {
  count: number
  colorIndex: number
}

export interface GraphItem {
  date: Date
  count?: number
  colorIndex: number
}

export interface ActivityColorRule {
  min: number,
  max: number,
  colorIndex: number
}

export interface Month {
  value: number
  index: number
}

export interface Locale {
  months: string[]
  days: string[]
  dayOfWeek: DayOfWeek
  less: string
  more: string
  defaultTooltipMessage: string
  noDataTooltipMessage: string
}