import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultConfig } from '@shared/types'
import type { AppConfig, HolidayEntry } from '@shared/types'

// 渲染进程通过 window.catdown 访问预加载暴露的 API
declare global {
  interface Window {
    catdown: {
      getConfig: () => Promise<AppConfig>
      setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>
      showMainWindow: () => void
      quitApp: () => void
      getHolidays: () => Promise<HolidayEntry[]>
      addHoliday: (date: string, name: string) => Promise<HolidayEntry[]>
      removeHoliday: (date: string) => Promise<HolidayEntry[]>
      resetHolidays: () => Promise<HolidayEntry[]>
      selectBackgroundImage: () => Promise<{
        path: string
        size: number
        dataUrl: string
        ext: string
      } | null>
      saveBackgroundImage: (base64Data: string, ext?: string) => Promise<string>
      readBackgroundImage: (relPath: string) => Promise<string | null>
    }
  }
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig>({ ...defaultConfig })
  const holidays = ref<string[]>([])
  const holidayEntries = ref<HolidayEntry[]>([])
  /** 当前背景图的 data URL（图片模式时使用，color 模式为空） */
  const backgroundUrl = ref<string>('')
  const loaded = ref(false)

  async function loadConfig(): Promise<void> {
    try {
      config.value = await window.catdown.getConfig()
      const entries = await window.catdown.getHolidays()
      holidayEntries.value = entries
      holidays.value = entries.map((h) => h.date)
      // 加载背景图
      if (config.value.background.mode === 'image' && config.value.background.imagePath) {
        const url = await window.catdown.readBackgroundImage(config.value.background.imagePath)
        backgroundUrl.value = url ?? ''
      } else {
        backgroundUrl.value = ''
      }
      loaded.value = true
    } catch (err) {
      console.error('加载配置失败:', err)
      config.value = { ...defaultConfig }
      loaded.value = true
    }
  }

  async function updateConfig(partial: Partial<AppConfig>): Promise<void> {
    try {
      config.value = await window.catdown.setConfig(partial)
    } catch (err) {
      console.error('保存配置失败:', err)
    }
  }

  async function refreshHolidays(): Promise<void> {
    try {
      const entries = await window.catdown.getHolidays()
      holidayEntries.value = entries
      holidays.value = entries.map((h) => h.date)
    } catch (err) {
      console.error('加载节假日失败:', err)
    }
  }

  /** 切换到图片模式后调用：读取图片为 data URL */
  async function refreshBackgroundUrl(): Promise<void> {
    if (config.value.background.mode === 'image' && config.value.background.imagePath) {
      const url = await window.catdown.readBackgroundImage(config.value.background.imagePath)
      backgroundUrl.value = url ?? ''
    } else {
      backgroundUrl.value = ''
    }
  }

  return {
    config,
    holidays,
    holidayEntries,
    backgroundUrl,
    loaded,
    loadConfig,
    updateConfig,
    refreshHolidays,
    refreshBackgroundUrl
  }
})
