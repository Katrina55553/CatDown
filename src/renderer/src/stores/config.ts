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
    }
  }
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig>({ ...defaultConfig })
  const holidays = ref<string[]>([])
  const holidayEntries = ref<HolidayEntry[]>([])
  const loaded = ref(false)

  async function loadConfig(): Promise<void> {
    try {
      config.value = await window.catdown.getConfig()
      const entries = await window.catdown.getHolidays()
      holidayEntries.value = entries
      holidays.value = entries.map((h) => h.date)
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

  return { config, holidays, holidayEntries, loaded, loadConfig, updateConfig, refreshHolidays }
})
