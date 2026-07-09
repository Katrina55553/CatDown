<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import type { CropRatio } from '@shared/types'

const props = defineProps<{
  /** 原图 data URL */
  src: string
  /** 裁剪比例 */
  cropRatio: CropRatio
  /** 原图扩展名（用于输出格式） */
  ext: string
}>()

const emit = defineEmits<{
  /** 应用裁剪：返回裁剪后的 data URL */
  apply: [dataUrl: string]
  cancel: []
}>()

const imgEl = ref<HTMLImageElement | null>(null)
let cropper: Cropper | null = null

function ratioValue(r: CropRatio): number {
  if (r === '16:9') return 16 / 9
  if (r === '1:1') return 1
  return NaN // free
}

function initCropper(): void {
  if (!imgEl.value) return
  destroyCropper()
  cropper = new Cropper(imgEl.value, {
    aspectRatio: ratioValue(props.cropRatio),
    viewMode: 1,
    dragMode: 'move',
    background: false,
    autoCropArea: 0.9,
    responsive: true,
    restore: false
  })
}

function destroyCropper(): void {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
}

// 比例变化时重置 cropper
watch(
  () => props.cropRatio,
  () => {
    if (cropper) {
      cropper.setAspectRatio(ratioValue(props.cropRatio))
    }
  }
)

onMounted(() => {
  initCropper()
})

onUnmounted(() => {
  destroyCropper()
})

function onApply(): void {
  if (!cropper) return
  const canvas = cropper.getCroppedCanvas({
    maxWidth: 4096,
    maxHeight: 4096,
    imageSmoothingQuality: 'high'
  })
  if (!canvas) return
  // jpg/jpeg 用 image/jpeg，其他用 image/png
  const outExt = props.ext === 'jpg' || props.ext === 'jpeg' ? 'jpeg' : 'png'
  const mime = `image/${outExt}`
  const dataUrl = canvas.toDataURL(mime, 0.92)
  emit('apply', dataUrl)
}

function onCancel(): void {
  emit('cancel')
}
</script>

<template>
  <div class="cropper-overlay" @click.self="onCancel">
    <div class="cropper-modal">
      <div class="cropper-title">裁剪背景图片</div>
      <div class="cropper-container">
        <img ref="imgEl" :src="src" alt="待裁剪图片" />
      </div>
      <div class="cropper-footer">
        <button class="btn btn-cancel" @click="onCancel">取消</button>
        <button class="btn btn-confirm" @click="onApply">应用</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.cropper-modal {
  width: 480px;
  max-width: 90vw;
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.cropper-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 12px;
  text-align: center;
}

.cropper-container {
  width: 100%;
  height: 320px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.cropper-container img {
  display: block;
  max-width: 100%;
}

.cropper-footer {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel {
  background: #0f3460;
  color: #a0a0a0;
}

.btn-cancel:hover {
  background: #1a4a8a;
}

.btn-confirm {
  background: #667eea;
  color: #ffffff;
}

.btn-confirm:hover {
  background: #5a6fd8;
}
</style>
