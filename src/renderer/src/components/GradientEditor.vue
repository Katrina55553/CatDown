<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GradientColor, GradientStop, GradientType } from '@shared/types'
import { gradientToCss, addStop, removeStop, updateStopColor, updateStopPosition } from '@shared/font-color'

const props = defineProps<{ modelValue: GradientColor }>()
const emit = defineEmits<{
  'update:modelValue': [g: GradientColor]
  close: []
}>()

// 本地草稿：进入弹窗时基于 modelValue 初始化
const draft = ref<GradientColor>(JSON.parse(JSON.stringify(props.modelValue)))

// 监听 props.modelValue 变化（外部更新时同步到 draft）
watch(
  () => props.modelValue,
  (v) => {
    draft.value = JSON.parse(JSON.stringify(v))
  }
)

const previewCss = computed(() => gradientToCss(draft.value))

function setGradientType(t: GradientType): void {
  draft.value = { ...draft.value, gradientType: t }
}

function setAngle(angle: number): void {
  draft.value = { ...draft.value, angle: Math.max(0, Math.min(360, angle)) }
}

function onAddStop(): void {
  draft.value = { ...draft.value, stops: addStop(draft.value.stops) }
}

function onRemoveStop(index: number): void {
  draft.value = { ...draft.value, stops: removeStop(draft.value.stops, index) }
}

function onColorChange(index: number, e: Event): void {
  const color = (e.target as HTMLInputElement).value
  draft.value = { ...draft.value, stops: updateStopColor(draft.value.stops, index, color) }
}

function onPositionChange(index: number, e: Event): void {
  const position = Number((e.target as HTMLInputElement).value)
  draft.value = { ...draft.value, stops: updateStopPosition(draft.value.stops, index, position) }
}

function onConfirm(): void {
  emit('update:modelValue', JSON.parse(JSON.stringify(draft.value)))
}

function onCancel(): void {
  emit('close')
}
</script>

<template>
  <div class="gradient-editor-overlay" @click.self="onCancel">
    <div class="gradient-editor">
      <div class="editor-title">渐变编辑</div>

      <!-- 实时预览 -->
      <div class="preview-box">
        <div class="preview-text" :style="{ background: previewCss }">下班还有 03:25:18</div>
        <div class="preview-bar" :style="{ background: previewCss }"></div>
      </div>

      <!-- 类型切换 -->
      <div class="editor-row">
        <div class="row-label">类型</div>
        <div class="seg-control">
          <button
            class="seg-btn"
            :class="{ active: draft.gradientType === 'linear' }"
            @click="setGradientType('linear')"
          >线性</button>
          <button
            class="seg-btn"
            :class="{ active: draft.gradientType === 'radial' }"
            @click="setGradientType('radial')"
          >径向</button>
        </div>
      </div>

      <!-- 角度（仅 linear） -->
      <div class="editor-row" v-if="draft.gradientType === 'linear'">
        <div class="row-label">角度 <span class="row-value">{{ draft.angle }}°</span></div>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          :value="draft.angle"
          class="slider"
          @input="setAngle(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- 色标列表 -->
      <div class="editor-row">
        <div class="row-label">色标 <span class="row-value">{{ draft.stops.length }} 个</span></div>
        <div class="stops-list">
          <div v-for="(stop, i) in draft.stops" :key="i" class="stop-row">
            <input
              type="color"
              class="color-input"
              :value="stop.color"
              @input="onColorChange(i, $event)"
            />
            <input
              type="range"
              class="slider stop-slider"
              min="0"
              max="100"
              step="1"
              :value="stop.position"
              @input="onPositionChange(i, $event)"
            />
            <span class="stop-pos">{{ stop.position }}%</span>
            <button
              class="remove-btn"
              :disabled="draft.stops.length <= 2"
              title="删除色标"
              @click="onRemoveStop(i)"
            >×</button>
          </div>
        </div>
        <button class="add-stop-btn" @click="onAddStop">+ 添加色标</button>
      </div>

      <!-- 底部按钮 -->
      <div class="editor-footer">
        <button class="btn btn-cancel" @click="onCancel">取消</button>
        <button class="btn btn-confirm" @click="onConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gradient-editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.gradient-editor {
  width: 360px;
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.editor-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 12px;
  text-align: center;
}

.preview-box {
  margin-bottom: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-text {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  letter-spacing: 1px;
}

.preview-bar {
  margin-top: 10px;
  height: 12px;
  border-radius: 4px;
}

.editor-row {
  margin-bottom: 12px;
}

.row-label {
  font-size: 12px;
  color: #a0a0a0;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row-value {
  color: #667eea;
  font-weight: 600;
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

.slider {
  width: 100%;
  accent-color: #667eea;
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.stop-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-input {
  width: 28px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.stop-slider {
  flex: 1;
}

.stop-pos {
  width: 36px;
  text-align: right;
  font-size: 11px;
  color: #a0a0a0;
  font-variant-numeric: tabular-nums;
}

.remove-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(231, 76, 60, 0.4);
  background: transparent;
  color: #e74c3c;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.remove-btn:hover:not(:disabled) {
  background: rgba(231, 76, 60, 0.15);
}

.remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-stop-btn {
  width: 100%;
  padding: 6px;
  border: 1px dashed rgba(102, 126, 234, 0.5);
  background: transparent;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.add-stop-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.editor-footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
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
