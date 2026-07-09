<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FontColor, GradientColor } from '@shared/types'
import { PRESET_COLORS, defaultGradient } from '@shared/types'
import { gradientToCss } from '@shared/font-color'
import GradientEditor from './GradientEditor.vue'

const props = defineProps<{ modelValue: FontColor }>()
const emit = defineEmits<{
  'update:modelValue': [fc: FontColor]
}>()

const editorOpen = ref(false)

const isSolidActive = computed(() => (color: string) => {
  return props.modelValue.type === 'solid' && props.modelValue.color === color
})

const isGradientActive = computed(() => props.modelValue.type === 'gradient')

const gradientPreviewCss = computed(() => {
  if (props.modelValue.type === 'gradient') {
    return gradientToCss(props.modelValue)
  }
  return gradientToCss(defaultGradient)
})

function selectSolid(color: string): void {
  emit('update:modelValue', { type: 'solid', color })
}

function openGradientEditor(): void {
  editorOpen.value = true
}

function onGradientChange(fc: GradientColor | null): void {
  if (fc) {
    emit('update:modelValue', fc)
  }
  editorOpen.value = false
}
</script>

<template>
  <div class="color-picker">
    <button
      v-for="(color, i) in PRESET_COLORS"
      :key="`solid-${i}`"
      class="color-dot"
      :class="{ active: isSolidActive(color) }"
      :style="{ background: color }"
      :title="color"
      @click="selectSolid(color)"
    ></button>

    <button
      class="color-dot gradient-dot"
      :class="{ active: isGradientActive }"
      :style="{ background: gradientPreviewCss }"
      title="渐变色"
      @click="openGradientEditor"
    ></button>

    <GradientEditor
      v-if="editorOpen"
      :model-value="modelValue.type === 'gradient' ? modelValue : defaultGradient"
      @update:model-value="onGradientChange"
      @close="editorOpen = false"
    />
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s, border-color 0.15s;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.color-dot:hover {
  transform: scale(1.1);
}

.color-dot.active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.6);
}

.gradient-dot {
  position: relative;
}

.gradient-dot::after {
  content: 'G';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
</style>
