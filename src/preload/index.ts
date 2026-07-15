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
   * 显示设置窗口
   */
  showMainWindow(): void {
    ipcRenderer.send(IPC_CHANNELS.SHOW_MAIN_WINDOW)
  },

  /**
   * 打开设置窗口（从桌宠调用）
   */
  openSettings(): void {
    ipcRenderer.send(IPC_CHANNELS.OPEN_SETTINGS)
  },

  /**
   * 退出应用
   */
  quitApp(): void {
    ipcRenderer.send(IPC_CHANNELS.QUIT_APP)
  },

  /**
   * 切换桌宠显示/隐藏
   */
  togglePet(): void {
    ipcRenderer.send(IPC_CHANNELS.PET_TOGGLE)
  },

  /**
   * 设置桌宠是否可交互（关闭/开启点击穿透）
   * 使用 send 而非 invoke，避免 IPC 往返延迟
   */
  setPetInteractive(interactive: boolean): void {
    ipcRenderer.send(IPC_CHANNELS.PET_SET_INTERACTIVE, interactive)
  },

  /**
   * 移动桌宠到绝对屏幕坐标
   */
  movePet(x: number, y: number): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.PET_MOVE, x, y)
  },

  /**
   * 获取桌宠当前屏幕坐标
   */
  getPetPosition(): Promise<{ x: number; y: number }> {
    return ipcRenderer.invoke(IPC_CHANNELS.PET_GET_POSITION)
  },

  /**
   * 保存桌宠当前位置到配置文件
   */
  savePetPosition(): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.PET_SAVE_POSITION)
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
  },

  /**
   * 选择背景图片（打开文件对话框，校验大小与格式）
   * 返回 { path, size, dataUrl, ext } 或 null（用户取消）
   */
  selectBackgroundImage(): Promise<{
    path: string
    size: number
    dataUrl: string
    ext: string
  } | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.BG_SELECT_IMAGE)
  },

  /**
   * 保存裁剪后的图片（base64）到 userData/bg/
   * 返回相对路径，例如 'background.png'
   */
  saveBackgroundImage(base64Data: string, ext?: string): Promise<string> {
    return ipcRenderer.invoke(IPC_CHANNELS.BG_SAVE_IMAGE, base64Data, ext)
  },

  /**
   * 读取背景图为 data URL（可直接用于 <img> / background-image）
   * 文件不存在返回 null
   */
  readBackgroundImage(relPath: string): Promise<string | null> {
    return ipcRenderer.invoke(IPC_CHANNELS.BG_READ_IMAGE, relPath)
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
