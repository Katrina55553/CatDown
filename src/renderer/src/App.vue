<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfigStore } from './stores/config'
import { computeDashboard } from './composables/dashboard'
import type { BackgroundConfig, AppConfig } from '@shared/types'
import PreviewPanel from './components/PreviewPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'

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

async function onUpdate(partial: Partial<AppConfig>): Promise<void> {
  await configStore.updateConfig(partial)
}

async function onUpdateBackground(bg: BackgroundConfig): Promise<void> {
  await configStore.updateConfig({ background: bg })
  // 切换/更新图片后，刷新 data URL
  await configStore.refreshBackgroundUrl()
}

onMounted(async () => {
  await configStore.loadConfig()
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="catdown-app">
    <!-- 左侧预览区 -->
    <PreviewPanel
      :state="dashboard"
      :show-cat="configStore.config.showCat"
      :show-income="configStore.config.showIncome"
      :show-payday="configStore.config.showPayday"
      :show-friday="configStore.config.showFriday"
      :show-holiday="configStore.config.showHoliday"
    />

    <!-- 右侧配置面板（极简模式时隐藏） -->
    <SettingsPanel
      v-if="!configStore.config.minimalMode"
      :config="configStore.config"
      @update="onUpdate"
      @update-background="onUpdateBackground"
    />

    <!-- 极简模式浮动切换按钮 -->
    <button
      v-if="configStore.config.minimalMode"
      class="minimal-toggle-btn"
      title="显示配置面板"
      @click="onUpdate({ minimalMode: false })"
    >⚙</button>
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
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  background: #2b1f2a;
  color: #f5e6e0;
}

.catdown-app {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 极简模式浮动切换按钮 */
.minimal-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.minimal-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: rotate(45deg);
}
</style>
