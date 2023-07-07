<template>
  <div :class="{'graph__container': true, 'dark-mode': darkMode}">
    <svg class="graph__wrapper" ref="svg" :viewBox="viewbox">
      <g class="graph__months__labels__wrapper" :transform="monthsLabelWrapperTransform">
        <text
            class="graph__month__label"
            v-for="(month, index) in heatmap.fullWeekOfMonths"
            :key="index"
            :x="getMonthLabelPosition(month).x"
            :y="getMonthLabelPosition(month).y">
          {{ locale.months[month.value] }}
        </text>
      </g>

      <g class="graph__days__labels__wrapper" :transform="daysLabelWrapperTransform">
        <text class="graph__day__label"
              :x="getDayOfWeekPositionX()"
              :y="8">
          {{ locale.days[0] }}
        </text>
        <text class="graph__day__label"
              :x="getDayOfWeekPositionX()"
              :y="32">
          {{ locale.days[2] }}
        </text>
        <text class="graph__day__label"
              :x="getDayOfWeekPositionX()"
              :y="56">
          {{ locale.days[4] }}
        </text>
      </g>

      <g class="graph__year__wrapper" :transform="YearWrapperTransform">
        <g class="graph__month__wrapper"
           v-for="(week, weekIndex) in heatmap.graph"
           :key="weekIndex"
           :transform="getWeekPosition(weekIndex)">
          <g
              v-for="(day, dayIndex) in week"
              :key="dayIndex"
              @mouseover="initTip"
          >
            <rect class="graph__day__square"
                  :rx="round"
                  :ry="round"
                  :transform="getDayPosition(dayIndex)"
                  :width="Heatmap.SquareSize"
                  :height="Heatmap.SquareSize"
                  :style="{ fill: colorSet[day.colorIndex] }"
                  :data-week-index="weekIndex"
                  :data-day-index="dayIndex"
            />
          </g>
        </g>
      </g>
    </svg>
    <div class="graph__legend">
      <div class="graph__legend__text">{{ locale.less }}</div>
      <svg class="graph__external__legend__wrapper" :viewBox="legendViewbox"
           :height="Heatmap.LegendSquareSize">
        <g class="graph__legend__wrapper"
           @mouseover="showLegendTip"
        >
          <rect class="graph__legend__square"
                v-for="item in activityColorRules"
                :key="item.colorIndex"
                :rx="round"
                :ry="round"
                :style="{ fill: colorSet[item.colorIndex] }"
                :width="Heatmap.SquareSize"
                :height="Heatmap.SquareSize"
                :x="SquareSizeWithGap * item.colorIndex"
                :data-item="JSON.stringify(item)"/>
        </g>
      </svg>
      <div class="graph__legend__text">{{ locale.more }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, PropType, ref, toRef, watch } from 'vue'
import { Heatmap } from '@/components/Heatmap'
import { Locale, Month, Value, GraphItem } from "@/components/interfaces"
import { InitTooltipLayout } from "@/components/types"
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/svg-arrow.css'
import 'tippy.js/animations/scale.css'

const props = defineProps({
  endDate: {
    required: true
  },
  values: {
    type: Array as PropType<Value[]>,
    required: true
  },
  locale: {
    type: Object as PropType<Locale>,
    default: Heatmap.LocaleRu
  },
  initTooltipLayout: {
    type: Function as PropType<InitTooltipLayout>
  },
  round: {
    type: Number,
    default: 0
  },
  darkMode: {
    type: Boolean,
    default: false
  }
})

const SquareGap = Heatmap.SquareSize / 5,
    SquareSizeWithGap = Heatmap.SquareSize + SquareGap,
    LeftSectionWidth = Math.ceil(Heatmap.SquareSize * 2.5),
    TopSectionHeight = Heatmap.SquareSize + (Heatmap.SquareSize / 2),
    BottomSectionHeight = Heatmap.SquareSize + (Heatmap.SquareSize / 2),
    YearWrapperTransform = `translate(${ LeftSectionWidth }, ${ TopSectionHeight })`,

    heatmap = ref(new Heatmap(props.endDate as Date, props.values)),
    width = ref(0),
    height = ref(0),
    viewbox = ref('0 0 0 0'),
    legendViewbox = ref('0 0 0 0'),
    daysLabelWrapperTransform = ref(''),
    monthsLabelWrapperTransform = ref(''),
    legendWrapperTransform = ref(''),
    colorSet = ref(props.darkMode ? Heatmap.DefaultColorSetDark : Heatmap.DefaultColorSetLight),
    activityColorRules = ref(Heatmap.ActivityColorRules)

const { initTooltipLayout } = props
let locale = props.locale

width.value = LeftSectionWidth + (SquareSizeWithGap * heatmap.value.weekCount) + SquareGap
height.value = TopSectionHeight + (SquareSizeWithGap * Heatmap.DaysInWeek)
viewbox.value = ` 0 0 ${ width.value } ${ height.value }`
daysLabelWrapperTransform.value = `translate(0, ${ TopSectionHeight })`
monthsLabelWrapperTransform.value = `translate(${ LeftSectionWidth }, 0)`

onMounted(initTippy)

function initTippy() {
  tippy.setDefaultProps({
    moveTransition: 'transform 0.1s ease-out',
    allowHTML: true,
    animation: 'scale'
  })
}

function getDayOfWeekPositionX(): number {
  if(locale === Heatmap.LocaleRu)
    return 8
  if(locale === Heatmap.LocaleEn)
    return 2

  return 0
}

function tooltipOptions(day: GraphItem): string {
  if (day.count != undefined) {
    if (props.initTooltipLayout)
      return props.initTooltipLayout(day, locale?.defaultTooltipMessage)

    return `
      <div class="tippy__tooltip">
        <b>${ day.count } ${ locale?.defaultTooltipMessage }</b> <br\>
        ${ locale?.dayOfWeek.get(day.date.getDay()) }
        ${ locale?.months[day.date.getMonth()] }
        ${ day.date.getDate() },
        ${ day.date.getFullYear() }
      </div>`
  }
  return `
    <div class="tippy__tooltip">
      <b>${ locale.noDataTooltipMessage }</b> <br\>
      ${ locale?.dayOfWeek.get(day.date.getDay()) }
      ${ locale?.months[day.date.getMonth()] }
      ${ day.date.getDate() },
      ${ day.date.getFullYear() }
    </div>`
}

function getWeekPosition(index: number): string {
  return `translate(${ index * SquareSizeWithGap }, 0)`
}

function getDayPosition(index: number): string {
  return `translate(0, ${ index * SquareSizeWithGap })`
}

function getMonthLabelPosition(month: Month): Object {
  return { x: SquareSizeWithGap * month.index, y: Heatmap.SquareSize }
}

watch(toRef(props, 'darkMode'), dm => colorSet.value = dm ? Heatmap.DefaultColorSetDark : Heatmap.DefaultColorSetLight)

watch([width, height, colorSet], ([newWidth, newHeight, newColorSet]) => {
  legendWrapperTransform.value =
      `translate(${ newWidth - (SquareSizeWithGap * newColorSet.length) - 30 }, ${ newHeight - BottomSectionHeight })`
})

watch(toRef(props, 'locale'), newLocale => (locale = newLocale ? { ...newLocale } : Heatmap.LocaleRu))

watch(colorSet, newColorSet => (legendViewbox.value = `0 0 ${ Heatmap.SquareSize * (newColorSet.length + 1) } ${ Heatmap.SquareSize }`), { immediate: true })

watch([props.values, locale?.defaultTooltipMessage, initTooltipLayout, colorSet],
    () => heatmap.value = new Heatmap(props.endDate as Date, props.values)
)

function showLegendTip(mouseEvent: MouseEvent): void {
  if (mouseEvent.target
      && (mouseEvent.target as HTMLElement).classList.contains('graph__legend__square')
      && (mouseEvent.target as HTMLElement).dataset.item != undefined
  ) {
    const item = JSON.parse((mouseEvent.target as HTMLElement).dataset.item!)
    let message

    if (item.min == undefined || item.min === 0 && item.max === 0)
      message = `${ locale?.noDataTooltipMessage }`
    else if (item.min == Heatmap.Max)
      message = `${ Heatmap.Max }+ ${ locale?.defaultTooltipMessage }`
    else
      message = `${ item.min }-${ item.max } ${ locale?.defaultTooltipMessage }`

    const tooltip = `
      <div class="tippy__tooltip">
        <b>${ message }</b> <br\>
      </div>`

    tippy(mouseEvent.target as HTMLElement, { content: tooltip, delay: [200, 100] })
  }
}

function initTip(mouseEvent: MouseEvent): void {
  if (mouseEvent.target
      && (mouseEvent.target as HTMLElement).classList.contains('graph__day__square')
      && (mouseEvent.target as HTMLElement).dataset.weekIndex != undefined
      && (mouseEvent.target as HTMLElement).dataset.dayIndex != undefined
  ) {
    const weekIndex = Number((mouseEvent.target as HTMLElement).dataset.weekIndex),
        dayIndex = Number((mouseEvent.target as HTMLElement).dataset.dayIndex)
    if (isNaN(weekIndex) || isNaN(dayIndex)) return

    const tooltip = tooltipOptions(heatmap.value.graph[weekIndex][dayIndex])
    if (tooltip == undefined) return

    tippy(mouseEvent.target as HTMLElement, { content: tooltip, trigger: 'click' })
  }
}
</script>

<style lang="scss">
.graph__container {
  .graph__legend {
    display: flex;
    justify-content: left;
    align-items: center;
    width: 1000px;
    margin-left: 35px;
  }

  .graph__external__legend__wrapper {
    margin: 0 8px;

    rect.graph__legend__square:focus {
      outline: none;
    }
  }

  .graph__legend__text {
    color: #767676
  }
}

.tippy__tooltip {
  text-align: center;
}

svg.graph__wrapper {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 10px;
  width: 100%;

  .graph__months__labels__wrapper text.graph__month__label {
    font-size: 10px;
  }

  .graph__days__labels__wrapper text.graph__day__label,
  .graph__legend__wrapper text {
    font-size: 9px;
  }

  text.graph__month__label,
  text.graph__day__label,
  .graph__legend__wrapper text {
    fill: #767676;
  }

  rect.graph__day__square:hover {
    stroke: #484848;
    stroke-width: 1.5px;
    paint-order: stroke;
  }

  rect.graph__day__square:focus {
    outline: none;
  }

  &.dark-mode {
    text.graph__month__label,
    text.graph__day__label,
    .graph__legend__wrapper text {
      fill: #fff;
    }
  }
}
</style>