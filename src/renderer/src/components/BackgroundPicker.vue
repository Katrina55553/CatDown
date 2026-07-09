<script setup lang="ts">
import { ref } from 'vue'
import type { BackgroundConfig, BackgroundMode, CropRatio } from '@shared/types'
import ImageCropper from './ImageCropper.vue'

const props = defineProps<{ modelValue: BackgroundConfig }>()
const emit = defineEmits<{
  'update:modelValue': [bg: BackgroundConfig]
}>()

const errorMsg = ref('')
const selecting = ref(false)
const cropping = ref(false)
const cropSrc = ref('')
const cropExt = ref('png')

function setMode(mode: BackgroundMode): void {
  emit('update:modelValue', { ...props.modelValue, mode })
}

function setColor(color: string): void {
  emit('update:modelValue', { ...props.modelValue, color })
}

function setCropRatio(ratio: CropRatio): void {
  emit('update:modelValue', { ...props.modelValue, cropRatio: ratio })
}

async function onSelectImage(): Promise<void> {
  errorMsg.value = ''
  selecting.value = true
  try {
    const result = await window.catdown.selectBackgroundImage()
    if (!result) {
      // 用户取消
      selecting.value = false
      return
    }
    cropSrc.value = result.dataUrl
    cropExt.value = result.ext
    cropping.value = true
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    selecting.value = false
  }
}

async function onApplyCrop(dataUrl: string): Promise<void> {
  cropping.value = false
  try {
    const relPath = await window.catdown.saveBackgroundImage(dataUrl, cropExt.value)
    emit('update:modelValue', {
      ...props.modelValue,
      mode: 'image',
      imagePath: relPath
    })
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  }
}

function onCancelCrop(): void {
  cropping.value = false
  cropSrc.value = ''
}
</script>

<template>
  <div class="bg-picker">
    <!-- 模式切换 -->
    <div class="seg-control">
      <button
        class="seg-btn"
        :class="{ active: modelValue.mode === 'color' }"
        @click="setMode('color')"
      >颜色</button>
      <button
        class="seg-btn"
        :class="{ active: modelValue.mode === 'image' }"
        @click="setMode('image')"
      >图片</button>
    </div>

    <!-- 颜色模式 -->
    <div v-if="modelValue.mode === 'color'" class="color-row">
      <input
        type="color"
        class="color-input"
        :value="modelValue.color"
        @input="setColor(($event.target as HTMLInputElement).value)"
      />
      <span class="color-hex">{{ modelValue.color }}</span>
    </div>

    <!-- 图片模式 -->
    <div v-else class="image-mode">
      <!-- 比例选择 -->
      <div class="ratio-row">
        <span class="ratio-label">裁剪比例</span>
        <button
          v-for="r in (['16:9', '1:1', 'free'] as CropRatio[])"
          :key="r"
          class="ratio-btn"
          :class="{ active: modelValue.cropRatio === r }"
          @click="setCropRatio(r)"
        >{{ r === 'free' ? '自由' : r }}</button>
      </div>

      <!-- 选择图片按钮 -->
      <button
        class="select-btn"
        :disabled="selecting"
        @click="onSelectImage"
      >{{ selecting ? '选择中...' : '选择本地图片' }}</button>

      <!-- 当前图片预览（如果有） -->
      <div v-if="modelValue.imagePath" class="current-image">
        <span class="current-label">当前：</span>
        <span class="current-path" :title="modelValue.imagePath">{{ modelValue.imagePath }}</span>
      </div>

      <div class="hint">支持 JPG/PNG/WebP，最大 5MB</div>
    </div>

    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

    <ImageCropper
      v-if="cropping"
      :src="cropSrc"
      :ext="cropExt"
      :crop-ratio="modelValue.cropRatio"
      @apply="onApplyCrop"
      @cancel="onCancelCrop"
    />
  </div>
</template>

<style scoped>
.bg-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seg-control {
  display: flex;
  gap: 4px;
  background: #0f3460;
  padding: 3px;
  border-radius: 6px;
}

.seg-btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  background: transparent;
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}

.seg-btn.active {
  background: #667eea;
  color: #ffffff;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 36px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.color-hex {
  font-size: 12px;
  color: #a0a0a0;
  font-family: monospace;
}

.image-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ratio-label {
  font-size: 11px;
  color: #a0a0a0;
  margin-right: 4px;
}

.ratio-btn {
  flex: 1;
  padding: 4px 0;
  border: 1px solid #0f3460;
  background: transparent;
  color: #a0a0a0;
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.ratio-btn:hover {
  border-color: #667eea;
  color: #ffffff;
}

.ratio-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #ffffff;
}

.select-btn {
  width: 100%;
  padding: 8px 0;
  border: 1px dashed rgba(102, 126, 234, 0.5);
  background: transparent;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.select-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.1);
}

.select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-image {
  font-size: 11px;
  color: #a0a0a0;
  word-break: break-all;
}

.current-label {
  color: #667eea;
}

.current-path {
  font-family: monospace;
}

.hint {
  font-size: 10px;
  color: #555;
}

.error {
  font-size: 11px;
  color: #e74c3c;
  padding: 4px 6px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
}
</style>
