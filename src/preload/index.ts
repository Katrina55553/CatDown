import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AppConfig, HolidayEntry } from '../shared/types'

const api = {
  /**
   * 获取当前配置
   */
  getConfig(): Promise<AppConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG)
  },

  /**
   * 更新配置（部分更新）
   */
  setConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    return ipcRenderer.invoke(IPC_CHANNELS.SET_CONFIG, config)
  },

  /**
   * 显示主窗口
   */
  showMainWindow(): void {
    ipcRenderer.send(IPC_CHANNELS.SHOW_MAIN_WINDOW)
  },

  /**
   * 退出应用
   */
  quitApp(): void {
    ipcRenderer.send(IPC_CHANNELS.QUIT_APP)
  },

  /**
   * 获取节假日列表
   */
  getHolidays(): Promise<HolidayEntry[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_HOLIDAYS)
  },

  /**
   * 添加节假日
   */
  addHoliday(date: string, name: string): Promise<HolidayEntry[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.ADD_HOLIDAY, date, name)
  },

  /**
   * 删除节假日
   */
  removeHoliday(date: string): Promise<HolidayEntry[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.REMOVE_HOLIDAY, date)
  },

  /**
   * 重置为默认节假日
   */
  resetHolidays(): Promise<HolidayEntry[]> {
    return ipcRenderer.invoke(IPC_CHANNELS.RESET_HOLIDAYS)
  }
}

export type CatDownApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('catdown', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore window
  window.catdown = api
}
