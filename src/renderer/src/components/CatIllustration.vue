<script setup lang="ts">
import { computed } from 'vue'
import type { PetState } from '@shared/types'

const props = defineProps<{
  /** 尺寸（px） */
  size?: number
  /** 动画状态 */
  state?: PetState
}>()

const currentState = computed(() => props.state ?? 'idle')

/** 眼睛渲染模式：正常 / 闭眼 / 开心弧线 */
const eyeMode = computed<'open' | 'closed' | 'happy'>(() => {
  if (currentState.value === 'sleeping') return 'closed'
  if (currentState.value === 'happy' || currentState.value === 'excited') return 'happy'
  return 'open'
})
</script>

<template>
  <div class="cat-illustration" :class="`cat-${currentState}`">
    <svg
      :width="size ?? 80"
      :height="size ?? 80"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 左耳 -->
      <polygon points="18,32 28,8 42,30" fill="#a55eea" />
      <polygon points="22,28 28,16 36,28" fill="#d4b3ff" />
      <!-- 右耳 -->
      <polygon points="58,30 72,8 82,32" fill="#a55eea" />
      <polygon points="64,28 72,16 78,28" fill="#d4b3ff" />
      <!-- 脸 -->
      <ellipse cx="50" cy="55" rx="32" ry="28" fill="#c39bff" />

      <!-- 眼睛 - 正常 -->
      <template v-if="eyeMode === 'open'">
        <ellipse cx="38" cy="50" rx="3.5" ry="5" fill="#2d2d44" />
        <ellipse cx="62" cy="50" rx="3.5" ry="5" fill="#2d2d44" />
        <circle cx="39" cy="48" r="1" fill="#ffffff" />
        <circle cx="63" cy="48" r="1" fill="#ffffff" />
      </template>

      <!-- 眼睛 - 闭眼（睡觉） -->
      <template v-else-if="eyeMode === 'closed'">
        <path d="M 34 50 Q 38 53 42 50" stroke="#2d2d44" fill="none" stroke-width="1.5" stroke-linecap="round" />
        <path d="M 58 50 Q 62 53 66 50" stroke="#2d2d44" fill="none" stroke-width="1.5" stroke-linecap="round" />
      </template>

      <!-- 眼睛 - 开心弧线 (^_^) -->
      <template v-else>
        <path d="M 34 52 Q 38 46 42 52" stroke="#2d2d44" fill="none" stroke-width="1.8" stroke-linecap="round" />
        <path d="M 58 52 Q 62 46 66 52" stroke="#2d2d44" fill="none" stroke-width="1.8" stroke-linecap="round" />
      </template>

      <!-- 鼻子 -->
      <polygon points="47,60 53,60 50,64" fill="#ff9ec7" />
      <!-- 嘴 -->
      <path d="M 50 64 Q 50 67 47 68" stroke="#2d2d44" fill="none" stroke-width="1.2" stroke-linecap="round" />
      <path d="M 50 64 Q 50 67 53 68" stroke="#2d2d44" fill="none" stroke-width="1.2" stroke-linecap="round" />
      <!-- 胡须 -->
      <line x1="22" y1="58" x2="32" y2="58" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="22" y1="63" x2="32" y2="61" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="68" y1="58" x2="78" y2="58" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="68" y1="61" x2="78" y2="63" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <!-- 腮红 -->
      <ellipse cx="28" cy="62" rx="4" ry="2.5" fill="#ff9ec7" opacity="0.5" />
      <ellipse cx="72" cy="62" rx="4" ry="2.5" fill="#ff9ec7" opacity="0.5" />
    </svg>

    <!-- 睡觉时的 Zzz -->
    <div v-if="currentState === 'sleeping'" class="zzz">
      <span class="z z1">z</span>
      <span class="z z2">z</span>
      <span class="z z3">Z</span>
    </div>

    <!-- 兴奋时的闪光 -->
    <div v-if="currentState === 'excited'" class="sparkles">
      <span class="sparkle s1">✦</span>
      <span class="sparkle s2">✦</span>
      <span class="sparkle s3">✧</span>
    </div>
  </div>
</template>

<style scoped>
.cat-illustration {
  display: inline-block;
  position: relative;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* idle：轻柔上下浮动 */
.cat-idle {
  animation: cat-bob 3s ease-in-out infinite;
}
@keyframes cat-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* happy：开心的弹跳 */
.cat-happy {
  animation: cat-happy 0.5s ease-out;
}
@keyframes cat-happy {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-12px) scale(1.08); }
  50% { transform: translateY(-6px) scale(1.04); }
  70% { transform: translateY(-10px) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
}

/* sleeping：缓慢摇摆 */
.cat-sleeping {
  animation: cat-sleep 4s ease-in-out infinite;
}
@keyframes cat-sleep {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-2px) rotate(1deg); }
}

/* excited：兴奋抖动 */
.cat-excited {
  animation: cat-excited 0.3s ease-in-out infinite;
}
@keyframes cat-excited {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(-2deg); }
  75% { transform: translateY(-4px) rotate(2deg); }
}

/* 睡觉 Zzz 动画 */
.zzz {
  position: absolute;
  top: -5px;
  right: 5px;
  pointer-events: none;
}
.z {
  position: absolute;
  font-size: 14px;
  font-weight: 700;
  color: #b388ff;
  opacity: 0;
}
.z1 { animation: z-float 3s ease-in-out infinite 0s; }
.z2 { animation: z-float 3s ease-in-out infinite 1s; font-size: 11px; }
.z3 { animation: z-float 3s ease-in-out infinite 2s; font-size: 16px; }
@keyframes z-float {
  0% { opacity: 0; transform: translate(0, 10px); }
  20% { opacity: 0.8; }
  80% { opacity: 0.4; }
  100% { opacity: 0; transform: translate(15px, -20px); }
}

/* 兴奋闪光动画 */
.sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.sparkle {
  position: absolute;
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
  opacity: 0;
}
.s1 { top: 5px; left: 0px; animation: sparkle-twinkle 1s ease-in-out infinite 0s; }
.s2 { top: 15px; right: 0px; animation: sparkle-twinkle 1s ease-in-out infinite 0.3s; }
.s3 { bottom: 10px; left: 5px; animation: sparkle-twinkle 1s ease-in-out infinite 0.6s; font-size: 12px; }
@keyframes sparkle-twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
