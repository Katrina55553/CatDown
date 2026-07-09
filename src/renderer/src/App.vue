<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfigStore } from './stores/config'
import { calculateCountdown, buildEngineConfig } from '@shared/engine'
import type { CountdownResult } from '@shared/types'

const configStore = useConfigStore()
const countdown = ref<CountdownResult | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

// 工作日标签
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function updateCountdown(): void {
  if (!configStore.loaded) return
  const engineConfig = buildEngineConfig(configStore.config, configStore.holidays)
  countdown.value = calculateCountdown({
    now: new Date(),
    config: engineConfig
  })
}

const displayText = computed<string>(() => {
  if (!countdown.value) return '加载中...'
  const r = countdown.value
  if (r.eventType === 'noWorkday') return r.label
  if (r.eventType !== 'working' && r.days >= 1) {
    return `${r.label} ${r.days}天 ${r.hours}小时`
  }
  return `${r.label} ${pad(r.hours)}:${pad(r.minutes)}:${pad(r.seconds)}`
})

// 切换工作日选中状态
async function toggleWorkday(day: number): Promise<void> {
  const workdays = [...configStore.config.workdays]
  const idx = workdays.indexOf(day)
  if (idx >= 0) {
    workdays.splice(idx, 1)
  } else {
    workdays.push(day)
    workdays.sort()
  }
  await configStore.updateConfig({ workdays })
  updateCountdown()
}

// 工作时间变更
async function onStartTimeChange(e: Event): Promise<void> {
  const value = (e.target as HTMLSelectElement).value
  await configStore.updateConfig({ startTime: value })
  updateCountdown()
}

async function onEndTimeChange(e: Event): Promise<void> {
  const value = (e.target as HTMLSelectElement).value
  await configStore.updateConfig({ endTime: value })
  updateCountdown()
}

// 校验：下班时间是否早于上班时间
const timeValidationError = computed<string>(() => {
  const { startTime, endTime } = configStore.config
  if (startTime >= endTime) {
    return '下班时间不能早于上班时间'
  }
  return ''
})

// 生成时间选项（每30分钟）
const timeOptions: string[] = (() => {
  const options: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      options.push(`${pad(h)}:${pad(m)}`)
    }
  }
  return options
})()

onMounted(async () => {
  await configStore.loadConfig()
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="catdown-app">
    <!-- 左侧预览区 -->
    <div class="preview-panel">
      <div class="countdown-display">{{ displayText }}</div>
    </div>

    <!-- 右侧配置面板 -->
    <div class="config-panel">
      <div class="config-section">
        <div class="config-label">工作日</div>
        <div class="weekday-tags">
          <button
            v-for="day in [1, 2, 3, 4, 5, 6, 0]"
            :key="day"
            class="weekday-tag"
            :class="{ active: configStore.config.workdays.includes(day) }"
            @click="toggleWorkday(day)"
          >
            {{ weekdayLabels[day] }}
          </button>
        </div>
      </div>

      <div class="config-section">
        <div class="config-label">工作时间</div>
        <div class="time-picker-row">
          <select
            class="time-select"
            :value="configStore.config.startTime"
            @change="onStartTimeChange"
          >
            <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
          <span class="time-separator">至</span>
          <select
            class="time-select"
            :value="configStore.config.endTime"
            @change="onEndTimeChange"
          >
            <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div v-if="timeValidationError" class="validation-error">
          {{ timeValidationError }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  background: #1a1a2e;
  color: #e0e0e0;
}

.catdown-app {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧预览区 */
.preview-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-width: 200px;
}

.countdown-display {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  text-align: center;
}

/* 右侧配置面板 */
.config-panel {
  width: 220px;
  padding: 16px;
  background: #16213e;
  overflow-y: auto;
  border-left: 1px solid #0f3460;
}

.config-section {
  margin-bottom: 20px;
}

.config-label {
  font-size: 12px;
  color: #a0a0a0;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 工作日标签 */
.weekday-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.weekday-tag {
  width: 28px;
  height: 28px;
  border: 1px solid #0f3460;
  border-radius: 6px;
  background: transparent;
  color: #a0a0a0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.weekday-tag:hover {
  border-color: #667eea;
  color: #ffffff;
}

.weekday-tag.active {
  background: #667eea;
  border-color: #667eea;
  color: #ffffff;
}

/* 时间选择器 */
.time-picker-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-select {
  flex: 1;
  padding: 6px 8px;
  background: #0f3460;
  border: 1px solid #1a1a4e;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.time-select:focus {
  border-color: #667eea;
}

.time-separator {
  color: #a0a0a0;
  font-size: 13px;
}

.validation-error {
  margin-top: 6px;
  font-size: 12px;
  color: #e74c3c;
}
</style>
