import { Activity, GraphItem } from "@/components/interfaces"

export type Activities = Map<string, Activity>
export type Graph = GraphItem[][]
export type DayOfWeek = Map<number, string>
export type InitTooltipLayout = (item: GraphItem, message: string) => string