import { ActivityColorRule, Locale, Month, Value } from "@/components/interfaces"
import { Activities, Graph } from "@/components/types"

export class Heatmap {

  // public static readonly DefaultColorSetLight = ['#ebedf0', '#c0ddf9', '#73b3f3', '#3886e1', '#17459e']
  public static readonly DefaultColorSetLight = ['#EDEDED', '#ACD5F2', '#7FA8C9', '#527BA0', '#254E77']
  public static readonly DefaultColorSetDark = ['#1f1f22', '#1e334a', '#1d466c', '#1d5689', '#1B95D1']

  public static readonly LocaleRu: Locale = {
    months: ['Янв.', 'Фев.', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Авг.', 'Сен.', 'Окт.', 'Нояб.', 'Дек.'],
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    dayOfWeek: new Map([
      [0, 'Воскресенья'],
      [1, 'Понедельник'],
      [2, 'Вторник'],
      [3, 'Среда'],
      [4, 'Четверг'],
      [5, 'Пятница'],
      [6, 'Суббота'],
    ]),
    less: 'Меньше',
    more: 'Больше',
    defaultTooltipMessage: 'контрибуций',
    noDataTooltipMessage: 'Нет контрибуций'
  }

  public static readonly LocaleEn: Locale = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dayOfWeek: new Map([
      [0, 'Sunday'],
      [1, 'Monday'],
      [2, 'Tuesday'],
      [3, 'Wednesday'],
      [4, 'Thursday'],
      [5, 'Friday'],
      [6, 'Saturday']
    ]),
    less: 'Less',
    more: 'More',
    defaultTooltipMessage: 'contributions',
    noDataTooltipMessage: 'No contributions'
  }

  public static readonly DaysToShift = 350
  public static readonly DaysInWeek = 7
  public static readonly SquareSize = 10
  public static readonly LegendSquareSize = 15
  public static readonly Max = 30

  public static readonly ActivityColorRules: Array<ActivityColorRule> = [
    {
      min: 0,
      max: 0,
      colorIndex: 0
    },
    {
      min: 1,
      max: 9,
      colorIndex: 1
    },
    {
      min: 10,
      max: 19,
      colorIndex: 2
    },
    {
      min: 20,
      max: 29,
      colorIndex: 3
    },
    {
      min: 30,
      max: Number.MAX_VALUE,
      colorIndex: 4
    }
  ]

  private readonly _startDate: Date
  private readonly _endDate: Date
  private readonly _values: Value[]

  private _fullWeekOfMonths?: Month[]
  private _activities?: Activities
  private _graph?: Graph

  public constructor(endDate: Date | string, values: Value[]) {
    this._endDate = Heatmap.parseDate(endDate)
    this._startDate = Heatmap.shiftDate(endDate, -Heatmap.DaysToShift)
    this._values = values
  }

  public get values(): Value[] {
    return this._values
  }

  public get activities(): Activities {
    if (this._activities)
      return this._activities

    this._activities = new Map()
    for (let i = 0, len = this.values.length; i < len; i++) {
      this._activities.set(Heatmap.keyDayParser(this.values[i].date), {
        count: this.values[i].count,
        colorIndex: this.getColorIndex(this.values[i].count) || 0
      })
    }
    return this._activities
  }

  public get weekCount(): number {
    return this.getDaysCount() / Heatmap.DaysInWeek
  }

  public get graph(): Graph {
    if (this._graph)
      return this._graph

    let shiftToMonday = -this.getCountEmptyDaysAtStart() + 1,
      date = Heatmap.shiftDate(this._startDate, shiftToMonday)
    this._graph = new Array(this.weekCount)
    let length = this._graph.length

    for (let i = 0; i < length; i++) {
      this._graph[i] = new Array(Heatmap.DaysInWeek)
      for (let j = 0; j < Heatmap.DaysInWeek; j++) {
        const activity = this.activities.get(Heatmap.keyDayParser(date))
        this._graph![i][j] = {
          date: new Date(date),
          count: activity ? activity.count : undefined,
          colorIndex: activity ? activity.colorIndex : 0
        }
        date.setDate(date.getDate() + 1)
      }
    }
    return this._graph
  }

  public get fullWeekOfMonths(): Month[] {
    if (this._fullWeekOfMonths)
      return this._fullWeekOfMonths

    this._fullWeekOfMonths = []
    length = this.graph.length
    for (let index = 1; index < length; index++) {
      const lastWeek = this.graph[index - 1][0].date,
        currentWeek = this.graph[index][0].date
      if (lastWeek.getFullYear() < currentWeek.getFullYear() || lastWeek.getMonth() < currentWeek.getMonth()) {
        this._fullWeekOfMonths.push({ value: currentWeek.getMonth(), index })
      }
    }
    return this._fullWeekOfMonths
  }

  private static shiftDate(date: Date | string, shiftDays: number): Date {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + shiftDays)
    return newDate
  }

  private static parseDate(date: Date | string): Date {
    return (date instanceof Date) ? date : (new Date(date))
  }

  private static keyDayParser(date: Date | string): string {
    const day = Heatmap.parseDate(date)
    return String(day.getFullYear()) + String(day.getMonth()).padStart(2, '0') + String(day.getDate()).padStart(2, '0')
  }

  public getColorIndex(count?: number): number {
    let colorIndex = 0

    if (count == undefined)
      return colorIndex

    for (let i = 0; i < Heatmap.ActivityColorRules.length; i++) {
      if (count >= Heatmap.ActivityColorRules[i].min && count <= Heatmap.ActivityColorRules[i].max) {
        colorIndex = Heatmap.ActivityColorRules[i].colorIndex
        break
      }
    }

    return colorIndex
  }

  public getCountEmptyDaysAtStart = (): number => this._startDate.getDay()

  public getCountEmptyDaysAtEnd = (): number => (Heatmap.DaysInWeek - 1) - this._endDate.getDay()

  public getDaysCount = (): number => Heatmap.DaysToShift + 1 + this.getCountEmptyDaysAtStart() + this.getCountEmptyDaysAtEnd()
}