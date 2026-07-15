<script setup lang="ts">
import type { DashboardState } from '../composables/dashboard'

defineProps<{
  state: DashboardState
  showIncome: boolean
  showPayday: boolean
  showFriday: boolean
  showHoliday: boolean
}>()
</script>

<template>
  <div class="pet-bubble">
    <!-- 倒计时主文案 -->
    <div class="bubble-countdown" :style="state.fontColorStyle">
      {{ state.displayText }}
    </div>

    <!-- 收入 -->
    <div
      v-if="showIncome && state.income?.shouldShow"
      class="bubble-card"
    >
      <span class="bubble-label">已赚</span>
      <span class="bubble-value">{{ state.income.formatted }}</span>
    </div>

    <!-- 发薪日 -->
    <div v-if="showPayday && state.payday" class="bubble-card">
      <span class="bubble-label">发薪</span>
      <span class="bubble-value">{{ state.payday.formatted }}</span>
    </div>

    <!-- 距离周五 -->
    <div v-if="showFriday && state.friday" class="bubble-card">
      <span class="bubble-label">周五</span>
      <span class="bubble-value">{{ state.friday.formatted }}</span>
    </div>

    <!-- 下一个节日 -->
    <div v-if="showHoliday && state.nextHoliday?.found" class="bubble-card">
      <span class="bubble-label">{{ state.nextHoliday.name }}</span>
      <span class="bubble-value">{{ state.nextHoliday.formatted }}</span>
    </div>

    <!-- 气泡小尖角 -->
    <div class="bubble-arrow"></div>
  </div>
</template>

<style scoped>
.pet-bubble {
  background: rgba(42, 28, 38, 0.92);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(255, 154, 139, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: bubble-in 0.2s ease-out;
}

@keyframes bubble-in {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.bubble-countdown {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 154, 139, 0.2);
  margin-bottom: 2px;
}

.bubble-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 120px;
}

.bubble-label {
  font-size: 11px;
  color: rgba(232, 197, 184, 0.8);
  white-space: nowrap;
}

.bubble-value {
  font-size: 13px;
  font-weight: 600;
  color: #f5e6e0;
  white-space: nowrap;
}

/* 气泡底部小尖角 */
.bubble-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(42, 28, 38, 0.92);
}
</style>
