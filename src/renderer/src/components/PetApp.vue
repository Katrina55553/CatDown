<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '../stores/config'
import { computeDashboard } from '../composables/dashboard'
import CatIllustration from './CatIllustration.vue'
import PetInfoBubble from './PetInfoBubble.vue'
import type { PetState } from '@shared/types'

const configStore = useConfigStore()
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const dashboard = computed(() =>
  computeDashboard({
    config: configStore.config,
    holidays: configStore.holidays,
    holidayEntries: configStore.holidayEntries,
    backgroundUrl: configStore.backgroundUrl,
    now: now.value
  })
)

// ===== 动画状态 =====
const petState = ref<PetState>('idle')
let happyTimer: ReturnType<typeof setTimeout> | null = null

/** 根据时间自动判断 idle/sleeping */
const currentPetState = computed<PetState>(() => {
  if (petState.value !== 'idle') return petState.value
  const cd = dashboard.value.countdown
  if (cd.eventType === 'afterWork' || cd.eventType === 'restDay' || cd.eventType === 'noWorkday') {
    return 'sleeping'
  }
  return 'idle'
})

function triggerHappy(): void {
  petState.value = 'happy'
  if (happyTimer) clearTimeout(happyTimer)
  happyTimer = setTimeout(() => {
    petState.value = 'idle'
  }, 600)
}

// ===== 悬停气泡 =====
const showBubble = ref(false)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function onCatMouseEnter(): void {
  window.catdown.setPetInteractive(true)
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    showBubble.value = true
  }, 100)
}

function onCatMouseLeave(): void {
  if (isDragging) return
  window.catdown.setPetInteractive(false)
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    showBubble.value = false
  }, 100)
}

// ===== 拖拽 =====
let isDragging = false
let hasDragged = false
let startScreenX = 0
let startScreenY = 0
let cachedWinX = 0
let cachedWinY = 0

function onCatMouseDown(e: MouseEvent): void {
  if (e.button !== 0) return
  isDragging = true
  hasDragged = false
  startScreenX = e.screenX
  startScreenY = e.screenY
}

function onWindowMouseMove(e: MouseEvent): void {
  if (!isDragging) return
  const dx = e.screenX - startScreenX
  const dy = e.screenY - startScreenY
  if (!hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
    hasDragged = true
    showBubble.value = false
  }
  if (hasDragged) {
    window.catdown.movePet(cachedWinX + dx, cachedWinY + dy)
  }
}

function onWindowMouseUp(): void {
  if (!isDragging) return
  isDragging = false
  if (!hasDragged) {
    triggerHappy()
  }
  window.catdown.savePetPosition()
  window.catdown.getPetPosition().then((pos) => {
    cachedWinX = pos.x
    cachedWinY = pos.y
  })
}

// ===== 右键菜单 =====
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

function onContextMenu(e: MouseEvent): void {
  e.preventDefault()
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  showContextMenu.value = true
}

function closeContextMenu(): void {
  showContextMenu.value = false
}

function openSettings(): void {
  window.catdown.openSettings()
  closeContextMenu()
}

function toggleAutoStart(): void {
  configStore.updateConfig({ autoStart: !configStore.config.autoStart })
  closeContextMenu()
}

function quitApp(): void {
  window.catdown.quitApp()
}

function hidePet(): void {
  configStore.updateConfig({ petEnabled: false })
  window.catdown.togglePet()
  closeContextMenu()
}

onMounted(async () => {
  await configStore.loadConfig()
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (happyTimer) clearTimeout(happyTimer)
  if (hoverTimer) clearTimeout(hoverTimer)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('click', closeContextMenu)
})
</script>

<template>
  <div class="pet-root">
    <!-- 悬停信息气泡 -->
    <Transition name="bubble-fade">
      <div v-if="showBubble" class="bubble-wrapper">
        <PetInfoBubble
          :state="dashboard"
          :show-income="configStore.config.showIncome"
          :show-payday="configStore.config.showPayday"
          :show-friday="configStore.config.showFriday"
          :show-holiday="configStore.config.showHoliday"
        />
      </div>
    </Transition>

    <!-- 猫咪主体 -->
    <div
      class="cat-wrapper"
      @mouseenter="onCatMouseEnter"
      @mouseleave="onCatMouseLeave"
      @mousedown="onCatMouseDown"
      @contextmenu="onContextMenu"
    >
      <CatIllustration :size="100" :state="currentPetState" />
    </div>

    <!-- 右键菜单 -->
    <Transition name="menu-fade">
      <div
        v-if="showContextMenu"
        class="context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
        @click.stop
      >
        <div class="menu-item" @click="openSettings">⚙ 打开设置</div>
        <div class="menu-item" @click="hidePet">
          🐱 隐藏桌宠
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item" @click="toggleAutoStart">
          {{ configStore.config.autoStart ? '✓ ' : '' }}开机自启
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item menu-danger" @click="quitApp">退出</div>
      </div>
    </Transition>
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
#pet-app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent !important;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  overflow: hidden;
}
</style>

<style scoped>
.pet-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 10px;
  position: relative;
}

/* 气泡容器 */
.bubble-wrapper {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* 猫咪 */
.cat-wrapper {
  cursor: grab;
  position: relative;
  z-index: 5;
}

.cat-wrapper:active {
  cursor: grabbing;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 100;
  background: rgba(42, 28, 38, 0.96);
  backdrop-filter: blur(16px);
  border-radius: 8px;
  padding: 4px 0;
  border: 1px solid rgba(255, 154, 139, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 140px;
}

.menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #f5e6e0;
  cursor: pointer;
  transition: background 0.12s;
}

.menu-item:hover {
  background: rgba(255, 154, 139, 0.15);
}

.menu-item.menu-danger:hover {
  background: rgba(255, 80, 80, 0.2);
  color: #ff8080;
}

.menu-separator {
  height: 1px;
  background: rgba(255, 154, 139, 0.15);
  margin: 4px 0;
}

/* 过渡动画 */
.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.12s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>
