import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import type { AppConfig } from '../../shared/types'
import { loadConfig, saveConfig } from '../config'
import { syncAutoStart } from '../auto-start'

/**
 * 注册配置相关 IPC：
 * - GET_CONFIG：读取当前配置
 * - SET_CONFIG：部分更新配置，autoStart 变化时同步系统自启
 */
export function registerConfigIpc(): void {
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => {
    return loadConfig()
  })

  ipcMain.handle(IPC_CHANNELS.SET_CONFIG, (_event, config: Partial<AppConfig>) => {
    const current = loadConfig()
    const updated = { ...current, ...config }
    saveConfig(updated)
    // 检测 autoStart 变化并同步到系统
    if (config.autoStart !== undefined && config.autoStart !== current.autoStart) {
      syncAutoStart(updated.autoStart)
    }
    return updated
  })
}
