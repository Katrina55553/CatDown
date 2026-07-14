<script setup lang="ts">
import { computed } from 'vue'
import type { AppConfig, FontColor, BackgroundConfig, SalaryType } from '@shared/types'
import ColorPicker from './ColorPicker.vue'
import BackgroundPicker from './BackgroundPicker.vue'

const props = defineProps<{
  config: AppConfig
}>()

const emit = defineEmits<{
  (e: 'update', partial: Partial<AppConfig>): void
  (e: 'update-background', bg: BackgroundConfig): void
}>()

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const timeOptions: string[] = (() => {
  const options: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      options.push(`${pad(h)}:${pad(m)}`)
    }
  }
  return options
})()

const timeValidationError = computed<string>(() => {
  const { startTime, endTime } = props.config
  if (startTime >= endTime) return '下班时间不能早于上班时间'
  return ''
})

async function toggleWorkday(day: number): Promise<void> {
  const workdays = [...props.config.workdays]
  const idx = workdays.indexOf(day)
  if (idx >= 0) {
    workdays.splice(idx, 1)
  } else {
    workdays.push(day)
    workdays.sort()
  }
  emit('update', { workdays })
}

function onStartTimeChange(e: Event): void {
  emit('update', { startTime: (e.target as HTMLSelectElement).value })
}

function onEndTimeChange(e: Event): void {
  emit('update', { endTime: (e.target as HTMLSelectElement).value })
}

function onSalaryInput(e: Event): void {
  const value = Number((e.target as HTMLInputElement).value)
  const field = props.config.salaryType === 'monthly' ? 'monthlySalary' : 'dailySalary'
  emit('update', { [field]: isNaN(value) ? 0 : value })
}

function onSalaryTypeChange(t: SalaryType): void {
  emit('update', { salaryType: t })
}

function onDecimalsChange(e: Event): void {
  const value = Number((e.target as HTMLSelectElement).value)
  emit('update', { incomeDecimals: value })
}

function toggleIncomeCard(): void {
  emit('update', { showIncome: !props.config.showIncome })
}

function togglePaydayCard(): void {
  emit('update', { showPayday: !props.config.showPayday })
}

function onPaydayInput(e: Event): void {
  const value = Number((e.target as HTMLInputElement).value)
  const clamped = Math.max(1, Math.min(31, isNaN(value) ? 1 : value))
  emit('update', { payday: clamped })
}

function togglePaydayAdvance(): void {
  emit('update', { paydayAdvanceOnHoliday: !props.config.paydayAdvanceOnHoliday })
}

function toggleFridayCard(): void {
  emit('update', { showFriday: !props.config.showFriday })
}

function toggleHolidayCard(): void {
  emit('update', { showHoliday: !props.config.showHoliday })
}

function toggleCat(): void {
  emit('update', { showCat: !props.config.showCat })
}

function toggleMinimalMode(): void {
  emit('update', { minimalMode: !props.config.minimalMode })
}

function toggleAutoStart(): void {
  emit('update', { autoStart: !props.config.autoStart })
}

function onFontColorChange(fc: FontColor): void {
  emit('update', { fontColor: fc })
}

function onBackgroundChange(bg: BackgroundConfig): void {
  emit('update-background', bg)
}
</script>

<template>
  <div class="config-panel">
    <div class="config-section">
      <div class="config-label">工作日</div>
      <div class="weekday-tags">
        <button
          v-for="day in [1, 2, 3, 4, 5, 6, 0]"
          :key="day"
          class="weekday-tag"
          :class="{ active: config.workdays.includes(day) }"
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
          :value="config.startTime"
          @change="onStartTimeChange"
        >
          <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
        </select>
        <span class="time-separator">至</span>
        <select
          class="time-select"
          :value="config.endTime"
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
        :model-value="config.fontColor"
        @update:model-value="onFontColorChange"
      />
    </div>

    <!-- 背景 -->
    <div class="config-section">
      <div class="config-label">背景</div>
      <BackgroundPicker
        :model-value="config.background"
        @update:model-value="onBackgroundChange"
      />
    </div>

    <!-- 薪资与收入设置 -->
    <div class="config-section">
      <div class="config-label">
        <label class="checkbox-row">
          <input
            type="checkbox"
            :checked="config.showIncome"
            @change="toggleIncomeCard"
          />
          <span>今天收入</span>
        </label>
      </div>

      <!-- 月薪 / 日薪 切换 -->
      <div class="seg-control salary-seg">
        <button
          class="seg-btn"
          :class="{ active: config.salaryType === 'monthly' }"
          @click="onSalaryTypeChange('monthly')"
        >月薪</button>
        <button
          class="seg-btn"
          :class="{ active: config.salaryType === 'daily' }"
          @click="onSalaryTypeChange('daily')"
        >日薪</button>
      </div>

      <input
        type="number"
        class="salary-input"
        :placeholder="config.salaryType === 'monthly' ? '输入月薪（元）' : '输入日薪（元）'"
        :value="(config.salaryType === 'monthly' ? config.monthlySalary : config.dailySalary) || ''"
        min="0"
        :step="config.salaryType === 'monthly' ? 100 : 10"
        @input="onSalaryInput"
      />
      <div class="config-label" style="margin-top: 8px;">小数位数</div>
      <select
        class="time-select"
        :value="config.incomeDecimals"
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
            :checked="config.showPayday"
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
          :value="config.payday"
          min="1"
          max="31"
          @input="onPaydayInput"
        />
        <span class="payday-text">号</span>
      </div>
      <label class="checkbox-row" style="margin-top: 8px;">
        <input
          type="checkbox"
          :checked="config.paydayAdvanceOnHoliday"
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
          :checked="config.showFriday"
          @change="toggleFridayCard"
        />
        <span>距离周五</span>
      </label>
      <label class="checkbox-row" style="margin-top: 6px;">
        <input
          type="checkbox"
          :checked="config.showHoliday"
          @change="toggleHolidayCard"
        />
        <span>下一个节日</span>
      </label>
      <label class="checkbox-row" style="margin-top: 6px;">
        <input
          type="checkbox"
          :checked="config.showCat"
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
          :checked="config.minimalMode"
          @change="toggleMinimalMode"
        />
        <span>极简模式（隐藏配置面板）</span>
      </label>
      <label class="checkbox-row" style="margin-top: 6px;">
        <input
          type="checkbox"
          :checked="config.autoStart"
          @change="toggleAutoStart"
        />
        <span>开机自启</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
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
</style>
