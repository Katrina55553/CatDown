<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { CSSProperties } from 'vue'
import { useConfigStore } from './stores/config'
import { calculateCountdown, buildEngineConfig } from '@shared/engine'
import { calculateTodayIncome } from '@shared/income'
import { calculatePayday } from '@shared/payday'
import { calculateFriday, findNextHoliday } from '@shared/auxiliary'
import { fontColorToCssColor, sanitizeFontColor } from '@shared/font-color'
import { defaultFontColor } from '@shared/types'
import type { CountdownResult, IncomeResult, PaydayResult, FridayResult, NextHolidayResult, FontColor, BackgroundConfig, SalaryType } from '@shared/types'
import ColorPicker from './components/ColorPicker.vue'
import BackgroundPicker from './components/BackgroundPicker.vue'
import CatIllustration from './components/CatIllustration.vue'

const configStore = useConfigStore()
const countdown = ref<CountdownResult | null>(null)
const income = ref<IncomeResult | null>(null)
const payday = ref<PaydayResult | null>(null)
const friday = ref<FridayResult | null>(null)
const nextHoliday = ref<NextHolidayResult | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function updateAll(): void {
  if (!configStore.loaded) return
  const engineConfig = buildEngineConfig(configStore.config, configStore.holidays)

  countdown.value = calculateCountdown({
    now: new Date(),
    config: engineConfig
  })

  income.value = calculateTodayIncome({
    now: new Date(),
    monthlySalary: configStore.config.monthlySalary,
    dailySalary: configStore.config.dailySalary,
    salaryType: configStore.config.salaryType,
    config: engineConfig,
    decimals: configStore.config.incomeDecimals
  })

  payday.value = calculatePayday({
    now: new Date(),
    payday: configStore.config.payday,
    advanceOnHoliday: configStore.config.paydayAdvanceOnHoliday,
    config: engineConfig
  })

  friday.value = calculateFriday(new Date(), engineConfig)

  nextHoliday.value = findNextHoliday(new Date(), configStore.holidayEntries)
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

// 主倒计时文字颜色样式
const fontColorStyle = computed<CSSProperties>(() => {
  const safe = sanitizeFontColor(configStore.config.fontColor, defaultFontColor)
  if (safe.type === 'solid') {
    return { color: safe.color }
  }
  // 渐变：用 background-clip: text 实现
  return {
    backgroundImage: fontColorToCssColor(safe),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent'
  }
})

async function onFontColorChange(fc: FontColor): Promise<void> {
  await configStore.updateConfig({ fontColor: fc })
}

// 预览区背景样式
const backgroundStyle = computed<CSSProperties>(() => {
  const bg = configStore.config.background
  if (bg.mode === 'image' && configStore.backgroundUrl) {
    return {
      backgroundImage: `url(${configStore.backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
  return { background: bg.color }
})

async function onBackgroundChange(bg: BackgroundConfig): Promise<void> {
  await configStore.updateConfig({ background: bg })
  // 切换/更新图片后，刷新 data URL
  await configStore.refreshBackgroundUrl()
}

async function toggleCat(): Promise<void> {
  await configStore.updateConfig({ showCat: !configStore.config.showCat })
}

async function toggleMinimalMode(): Promise<void> {
  await configStore.updateConfig({ minimalMode: !configStore.config.minimalMode })
}

async function toggleAutoStart(): Promise<void> {
  await configStore.updateConfig({ autoStart: !configStore.config.autoStart })
}

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
  updateAll()
}

async function onStartTimeChange(e: Event): Promise<void> {
  await configStore.updateConfig({ startTime: (e.target as HTMLSelectElement).value })
  updateAll()
}

async function onEndTimeChange(e: Event): Promise<void> {
  await configStore.updateConfig({ endTime: (e.target as HTMLSelectElement).value })
  updateAll()
}

async function onSalaryInput(e: Event): Promise<void> {
  const value = Number((e.target as HTMLInputElement).value)
  const field = configStore.config.salaryType === 'monthly' ? 'monthlySalary' : 'dailySalary'
  await configStore.updateConfig({ [field]: isNaN(value) ? 0 : value })
  updateAll()
}

async function onSalaryTypeChange(t: SalaryType): Promise<void> {
  await configStore.updateConfig({ salaryType: t })
  updateAll()
}

async function onDecimalsChange(e: Event): Promise<void> {
  const value = Number((e.target as HTMLSelectElement).value)
  await configStore.updateConfig({ incomeDecimals: value })
  updateAll()
}

async function toggleIncomeCard(): Promise<void> {
  await configStore.updateConfig({ showIncome: !configStore.config.showIncome })
}

async function togglePaydayCard(): Promise<void> {
  await configStore.updateConfig({ showPayday: !configStore.config.showPayday })
}

async function onPaydayInput(e: Event): Promise<void> {
  const value = Number((e.target as HTMLInputElement).value)
  const clamped = Math.max(1, Math.min(31, isNaN(value) ? 1 : value))
  await configStore.updateConfig({ payday: clamped })
  updateAll()
}

async function togglePaydayAdvance(): Promise<void> {
  await configStore.updateConfig({ paydayAdvanceOnHoliday: !configStore.config.paydayAdvanceOnHoliday })
  updateAll()
}

async function toggleFridayCard(): Promise<void> {
  await configStore.updateConfig({ showFriday: !configStore.config.showFriday })
}

async function toggleHolidayCard(): Promise<void> {
  await configStore.updateConfig({ showHoliday: !configStore.config.showHoliday })
}

const timeValidationError = computed<string>(() => {
  const { startTime, endTime } = configStore.config
  if (startTime >= endTime) return '下班时间不能早于上班时间'
  return ''
})

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
  updateAll()
  timer = setInterval(updateAll, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="catdown-app">
    <!-- 左侧预览区 -->
    <div class="preview-panel" :style="backgroundStyle">
      <div class="countdown-display" :style="fontColorStyle">{{ displayText }}</div>

      <!-- 猫咪插画 -->
      <CatIllustration v-if="configStore.config.showCat" :size="80" />

      <!-- 今天收入卡片 -->
      <div
        v-if="configStore.config.showIncome && income?.shouldShow"
        class="income-card"
      >
        <div class="income-label">今天已赚</div>
        <div class="income-amount">{{ income.formatted }}</div>
        <div class="income-hint">{{ income.hint }}</div>
      </div>

      <!-- 收入卡片占位 -->
      <div
        v-else-if="configStore.config.showIncome && !income?.shouldShow && income"
        class="income-card placeholder"
      >
        <div class="income-hint">{{ income.hint }}</div>
      </div>

      <!-- 发薪日卡片 -->
      <div v-if="configStore.config.showPayday && payday" class="info-card">
        <div class="info-label">发薪日</div>
        <div class="info-value">{{ payday.formatted }}</div>
      </div>

      <!-- 距离周五卡片 -->
      <div v-if="configStore.config.showFriday && friday" class="info-card">
        <div class="info-label">距离周五</div>
        <div class="info-value">{{ friday.formatted }}</div>
      </div>

      <!-- 下一个节日卡片 -->
      <div v-if="configStore.config.showHoliday && nextHoliday?.found" class="info-card">
        <div class="info-label">{{ nextHoliday.name }}</div>
        <div class="info-value">{{ nextHoliday.formatted }}</div>
      </div>
    </div>

    <!-- 右侧配置面板（极简模式时隐藏） -->
    <div v-if="!configStore.config.minimalMode" class="config-panel">
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

      <!-- 字体颜色 -->
      <div class="config-section">
        <div class="config-label">字体颜色</div>
        <ColorPicker
          :model-value="configStore.config.fontColor"
          @update:model-value="onFontColorChange"
        />
      </div>

      <!-- 背景 -->
      <div class="config-section">
        <div class="config-label">背景</div>
        <BackgroundPicker
          :model-value="configStore.config.background"
          @update:model-value="onBackgroundChange"
        />
      </div>

      <!-- 薪资与收入设置 -->
      <div class="config-section">
        <div class="config-label">
          <label class="checkbox-row">
            <input
              type="checkbox"
              :checked="configStore.config.showIncome"
              @change="toggleIncomeCard"
            />
            <span>今天收入</span>
          </label>
        </div>

        <!-- 月薪 / 日薪 切换 -->
        <div class="seg-control salary-seg">
          <button
            class="seg-btn"
            :class="{ active: configStore.config.salaryType === 'monthly' }"
            @click="onSalaryTypeChange('monthly')"
          >月薪</button>
          <button
            class="seg-btn"
            :class="{ active: configStore.config.salaryType === 'daily' }"
            @click="onSalaryTypeChange('daily')"
          >日薪</button>
        </div>

        <input
          type="number"
          class="salary-input"
          :placeholder="configStore.config.salaryType === 'monthly' ? '输入月薪（元）' : '输入日薪（元）'"
          :value="(configStore.config.salaryType === 'monthly' ? configStore.config.monthlySalary : configStore.config.dailySalary) || ''"
          min="0"
          :step="configStore.config.salaryType === 'monthly' ? 100 : 10"
          @input="onSalaryInput"
        />
        <div class="config-label" style="margin-top: 8px;">小数位数</div>
        <select
          class="time-select"
          :value="configStore.config.incomeDecimals"
          @change="onDecimalsChange"
        >
          <option :value="0">0 位（¥978）</option>
          <option :value="2">2 位（¥978.40）</option>
          <option :value="3">3 位（¥978.395）</option>
        </select>
      </div>

      <!-- 发薪日设置 -->
      <div class="config-section">
        <div class="config-label">
          <label class="checkbox-row">
            <input
              type="checkbox"
              :checked="configStore.config.showPayday"
              @change="togglePaydayCard"
            />
            <span>发薪日</span>
          </label>
        </div>
        <div class="payday-row">
          <span class="payday-text">每月</span>
          <input
            type="number"
            class="payday-input"
            :value="configStore.config.payday"
            min="1"
            max="31"
            @input="onPaydayInput"
          />
          <span class="payday-text">号</span>
        </div>
        <label class="checkbox-row" style="margin-top: 8px;">
          <input
            type="checkbox"
            :checked="configStore.config.paydayAdvanceOnHoliday"
            @change="togglePaydayAdvance"
          />
          <span>遇节假日提前发</span>
        </label>
      </div>

      <!-- 显示更多开关 -->
      <div class="config-section">
        <div class="config-label">显示更多</div>
        <label class="checkbox-row">
          <input
            type="checkbox"
            :checked="configStore.config.showFriday"
            @change="toggleFridayCard"
          />
          <span>距离周五</span>
        </label>
        <label class="checkbox-row" style="margin-top: 6px;">
          <input
            type="checkbox"
            :checked="configStore.config.showHoliday"
            @change="toggleHolidayCard"
          />
          <span>下一个节日</span>
        </label>
        <label class="checkbox-row" style="margin-top: 6px;">
          <input
            type="checkbox"
            :checked="configStore.config.showCat"
            @change="toggleCat"
          />
          <span>猫咪插画</span>
        </label>
      </div>

      <!-- 极简模式 -->
      <div class="config-section">
        <div class="config-label">模式</div>
        <label class="checkbox-row">
          <input
            type="checkbox"
            :checked="configStore.config.minimalMode"
            @change="toggleMinimalMode"
          />
          <span>极简模式（隐藏配置面板）</span>
        </label>
        <label class="checkbox-row" style="margin-top: 6px;">
          <input
            type="checkbox"
            :checked="configStore.config.autoStart"
            @change="toggleAutoStart"
          />
          <span>开机自启</span>
        </label>
      </div>
    </div>

    <!-- 极简模式浮动切换按钮 -->
    <button
      v-if="configStore.config.minimalMode"
      class="minimal-toggle-btn"
      title="显示配置面板"
      @click="toggleMinimalMode"
    >⚙</button>
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
  background: #2b1f2a;
  color: #f5e6e0;
}

.catdown-app {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧预览区 - 温馨暖色渐变 */
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: linear-gradient(135deg, #ff9a8b 0%, #ff6a88 50%, #ff99ac 100%);
  min-width: 200px;
  padding: 20px;
  position: relative;
}

/* 预览区柔光叠加 */
.preview-panel::before {
  content: '';
  position: absolute;
  top: 10%;
  right: 10%;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 220, 180, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.countdown-display {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
  letter-spacing: 1px;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* 收入卡片 - 暖色磨砂玻璃 */
.income-card {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 12px 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.15);
}

.income-card.placeholder {
  opacity: 0.65;
}

.income-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.income-amount {
  font-size: 22px;
  font-weight: 700;
  color: #fff3cd;
  text-shadow: 0 1px 4px rgba(204, 85, 0, 0.4);
}

.income-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

/* 右侧配置面板 - 温馨暖灰背景 */
.config-panel {
  width: 220px;
  padding: 16px;
  background: #3a2a30;
  overflow-y: auto;
  border-left: 1px solid rgba(255, 154, 139, 0.3);
}

.config-section {
  margin-bottom: 20px;
}

.config-label {
  font-size: 12px;
  color: #e8c5b8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weekday-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.weekday-tag {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 154, 139, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #d4b5a8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.weekday-tag:hover {
  border-color: #ff7e8b;
  color: #ffffff;
}

.weekday-tag.active {
  background: #ff7e8b;
  border-color: #ff7e8b;
  color: #ffffff;
}

.time-picker-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-select {
  flex: 1;
  padding: 6px 8px;
  background: #4a2f38;
  border: 1px solid rgba(255, 154, 139, 0.3);
  border-radius: 6px;
  color: #f5e6e0;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.time-select:focus {
  border-color: #ff9a8b;
}

.time-separator {
  color: #d4b5a8;
  font-size: 13px;
}

.validation-error {
  margin-top: 6px;
  font-size: 12px;
  color: #ff6b6b;
}

/* 复选框行 */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
}

.checkbox-row input[type='checkbox'] {
  accent-color: #ff7e8b;
}

/* 月薪/日薪切换 */
.seg-control {
  display: flex;
  gap: 4px;
  background: #4a2f38;
  padding: 3px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.seg-btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  background: transparent;
  color: #d4b5a8;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.seg-btn.active {
  background: #ff7e8b;
  color: #ffffff;
}

.seg-btn:hover:not(.active) {
  color: #ffffff;
}

/* 薪资输入框 */
.salary-input {
  width: 100%;
  padding: 6px 8px;
  background: #4a2f38;
  border: 1px solid rgba(255, 154, 139, 0.3);
  border-radius: 6px;
  color: #f5e6e0;
  font-size: 13px;
  outline: none;
}

.salary-input:focus {
  border-color: #ff9a8b;
}

.salary-input::placeholder {
  color: #8a6a6a;
}

/* 信息卡片（发薪日等） - 暖色磨砂玻璃 */
.info-card {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 10px 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.12);
}

.info-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

/* 发薪日输入 */
.payday-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.payday-text {
  font-size: 13px;
  color: #e8c5b8;
}

.payday-input {
  width: 50px;
  padding: 4px 6px;
  background: #4a2f38;
  border: 1px solid rgba(255, 154, 139, 0.3);
  border-radius: 6px;
  color: #f5e6e0;
  font-size: 13px;
  outline: none;
  text-align: center;
}

.payday-input:focus {
  border-color: #ff9a8b;
}

/* 极简模式浮动切换按钮 */
.minimal-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.minimal-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: rotate(45deg);
}
</style>
