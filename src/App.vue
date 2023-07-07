<template>
  <ContributionGraph
      :values="contributions"
      :end-date="endDate"
      :style="{'max-width': '1000px'}"
      :locale="Heatmap.LocaleRu"
  />
  <br>
  <ContributionGraph
      :values="contributions"
      :end-date="endDate"
      :style="{'max-width': '1000px'}"
      :locale="Heatmap.LocaleEn"
      :round="10"
  />
</template>

<script lang="ts">
export default {}
</script>

<script setup lang="ts">
import ContributionGraph from '@/components/ContributionGraph.vue'
import { getData } from './data'
import { Value } from "@/components/interfaces"
import { reactive } from "vue"
import { Heatmap } from '@/components/Heatmap'

const endDate = new Date('2023-07-10')
let contributions: Value[] = reactive([])

getData()
    .then(data => {
      const days: Array<string> = Object.keys(data)
      const activities: Array<number> = Object.values(data)
      const length = Object.keys(data).length

      for (let i = 0; i < length; i++) {
        contributions.push({
          date: days[i],
          count: activities[i]
        })
      }
    })

</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 12px;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  align-content: flex-start;
  justify-content: center;
}
</style>
