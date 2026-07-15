import { ipcMain, app } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { getTray } from '../tray'
import {
  togglePet,
  setPetInteractive,
  movePet,
  getPetPosition,
  savePetPosition
} from '../pet-window'

/**
 * 注册窗口/应用生命周期 IPC：
 * - SHOW_MAIN_WINDOW：显示并聚焦设置窗口
 * - OPEN_SETTINGS：从桌宠打开设置窗口
 * - QUIT_APP：销毁托盘并退出应用
 * - PET_TOGGLE：显示/隐藏桌宠
 * - PET_SET_INTERACTIVE：切换桌宠点击穿透
 * - PET_MOVE：移动桌宠到绝对位置
 * - PET_GET_POSITION：获取桌宠当前位置
 * - PET_SAVE_POSITION：保存桌宠位置到配置
 */
export function registerWindowIpc(showSettingsWindow: () => void): void {
  ipcMain.on(IPC_CHANNELS.SHOW_MAIN_WINDOW, () => {
    showSettingsWindow()
  })

  ipcMain.on(IPC_CHANNELS.OPEN_SETTINGS, () => {
    showSettingsWindow()
  })

  ipcMain.on(IPC_CHANNELS.QUIT_APP, () => {
    getTray()?.destroy()
    app.quit()
  })

  ipcMain.on(IPC_CHANNELS.PET_TOGGLE, () => {
    togglePet()
  })

  ipcMain.handle(IPC_CHANNELS.PET_SET_INTERACTIVE, (_event, interactive: boolean) => {
    setPetInteractive(interactive)
  })

  ipcMain.handle(IPC_CHANNELS.PET_MOVE, (_event, x: number, y: number) => {
    movePet(x, y)
  })

  ipcMain.handle(IPC_CHANNELS.PET_GET_POSITION, () => {
    return getPetPosition()
  })

  ipcMain.handle(IPC_CHANNELS.PET_SAVE_POSITION, () => {
    savePetPosition()
  })
}
