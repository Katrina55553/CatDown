<script setup lang="ts">
import type { DashboardState } from '../composables/dashboard'
import CatIllustration from './CatIllustration.vue'

defineProps<{
  state: DashboardState
  showCat: boolean
  showIncome: boolean
  showPayday: boolean
  showFriday: boolean
  showHoliday: boolean
}>()
</script>

<template>
  <div
    class="preview-panel"
    :class="{ 'is-preset': state.isPreset }"
    :style="state.backgroundStyle"
  >
    <!-- 预设背景的动画叠层 -->
    <div v-if="state.overlayClass" class="bg-overlay" :class="state.overlayClass"></div>

    <div class="countdown-display" :style="state.fontColorStyle">{{ state.displayText }}</div>

    <!-- 猫咪插画 -->
    <CatIllustration v-if="showCat" :size="80" />

    <!-- 今天收入卡片 -->
    <div
      v-if="showIncome && state.income?.shouldShow"
      class="income-card"
    >
      <div class="income-label">今天已赚</div>
      <div class="income-amount">{{ state.income.formatted }}</div>
      <div class="income-hint">{{ state.income.hint }}</div>
    </div>

    <!-- 收入卡片占位 -->
    <div
      v-else-if="showIncome && !state.income?.shouldShow && state.income"
      class="income-card placeholder"
    >
      <div class="income-hint">{{ state.income.hint }}</div>
    </div>

    <!-- 发薪日卡片 -->
    <div v-if="showPayday && state.payday" class="info-card">
      <div class="info-label">发薪日</div>
      <div class="info-value">{{ state.payday.formatted }}</div>
    </div>

    <!-- 距离周五卡片 -->
    <div v-if="showFriday && state.friday" class="info-card">
      <div class="info-label">距离周五</div>
      <div class="info-value">{{ state.friday.formatted }}</div>
    </div>

    <!-- 下一个节日卡片 -->
    <div v-if="showHoliday && state.nextHoliday?.found" class="info-card">
      <div class="info-label">{{ state.nextHoliday.name }}</div>
      <div class="info-value">{{ state.nextHoliday.formatted }}</div>
    </div>
  </div>
</template>

<style scoped>
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
  overflow: hidden;
  isolation: isolate;
}

/* 预览区柔光叠加（仅非预设模式下显示，避免与预设背景冲突） */
.preview-panel:not(.is-preset)::before {
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

/* 预设背景的动画叠层：位于基底背景之上、内容卡片之下 */
.bg-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

/* —— 极光：两团缓慢漂移的柔光 —— */
.overlay-aurora::before,
.overlay-aurora::after {
  content: '';
  position: absolute;
  width: 70%;
  height: 60%;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  mix-blend-mode: screen;
  will-change: transform;
}
.overlay-aurora::before {
  top: -15%;
  left: -10%;
  background: radial-gradient(circle, rgba(120, 235, 190, 0.55), transparent 70%);
  animation: aurora-drift-a 18s ease-in-out infinite alternate;
}
.overlay-aurora::after {
  bottom: -15%;
  right: -10%;
  background: radial-gradient(circle, rgba(150, 125, 235, 0.5), transparent 70%);
  animation: aurora-drift-b 22s ease-in-out infinite alternate;
}
@keyframes aurora-drift-a {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(28%, 18%) scale(1.2); }
}
@keyframes aurora-drift-b {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-22%, -14%) scale(1.15); }
}

/* —— 深海：缓缓旋转的光带 —— */
.overlay-abyss::before,
.overlay-abyss::after {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(ellipse 40% 8% at 30% 25%, rgba(150, 220, 255, 0.18), transparent 70%),
    radial-gradient(ellipse 35% 6% at 70% 65%, rgba(120, 200, 240, 0.14), transparent 70%),
    radial-gradient(ellipse 30% 5% at 50% 45%, rgba(180, 230, 255, 0.10), transparent 70%);
  will-change: transform;
}
.overlay-abyss::before {
  animation: abyss-rays 26s linear infinite;
}
.overlay-abyss::after {
  animation: abyss-rays 38s linear infinite reverse;
  opacity: 0.6;
}
@keyframes abyss-rays {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1.1); }
}

/* —— 星河：闪烁的星点 —— */
.overlay-cosmos::before,
.overlay-cosmos::after {
  content: '';
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
}
.overlay-cosmos::before {
  background-image:
    radial-gradient(1.5px 1.5px at 20% 30%, #ffffff, transparent),
    radial-gradient(1px 1px at 40% 70%, #ffffff, transparent),
    radial-gradient(1.5px 1.5px at 60% 20%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 80% 50%, #ffffff, transparent),
    radial-gradient(1.5px 1.5px at 30% 80%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1px 1px at 70% 90%, #ffffff, transparent),
    radial-gradient(2px 2px at 50% 45%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 15% 60%, #ffffff, transparent),
    radial-gradient(1.5px 1.5px at 85% 25%, rgba(255, 255, 255, 0.75), transparent),
    radial-gradient(1px 1px at 55% 75%, #ffffff, transparent);
  animation: cosmos-twinkle 4s ease-in-out infinite alternate;
}
.overlay-cosmos::after {
  background-image:
    radial-gradient(1px 1px at 25% 15%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 65% 85%, rgba(200, 220, 255, 0.7), transparent),
    radial-gradient(1px 1px at 10% 90%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 90% 65%, rgba(255, 240, 200, 0.6), transparent),
    radial-gradient(1px 1px at 45% 10%, rgba(255, 255, 255, 0.55), transparent);
  animation: cosmos-twinkle 6s ease-in-out infinite alternate-reverse;
}
@keyframes cosmos-twinkle {
  0% { opacity: 0.45; }
  100% { opacity: 1; }
}

/* 尊重「减少动态」偏好：暂停所有预设动画 */
@media (prefers-reduced-motion: reduce) {
  .overlay-aurora::before,
  .overlay-aurora::after,
  .overlay-abyss::before,
  .overlay-abyss::after,
  .overlay-cosmos::before,
  .overlay-cosmos::after {
    animation: none;
  }
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
</style>
