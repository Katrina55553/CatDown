<script setup lang="ts">
defineProps<{
  /** 尺寸（px） */
  size?: number
}>()
</script>

<template>
  <div class="cat-illustration">
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
      <!-- 眼睛 -->
      <ellipse cx="38" cy="50" rx="3.5" ry="5" fill="#2d2d44" />
      <ellipse cx="62" cy="50" rx="3.5" ry="5" fill="#2d2d44" />
      <!-- 眼睛高光 -->
      <circle cx="39" cy="48" r="1" fill="#ffffff" />
      <circle cx="63" cy="48" r="1" fill="#ffffff" />
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
  </div>
</template>

<style scoped>
.cat-illustration {
  display: inline-block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: cat-bob 3s ease-in-out infinite;
}

@keyframes cat-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
</style>
