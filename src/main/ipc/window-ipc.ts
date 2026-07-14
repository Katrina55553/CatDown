import { ipcMain, app } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { getTray } from '../tray'

/**
 * 注册窗口/应用生命周期 IPC：
 * - SHOW_MAIN_WINDOW：显示并聚焦主窗口
 * - QUIT_APP：销毁托盘并退出应用
 */
export function registerWindowIpc(showMainWindow: () => void): void {
  ipcMain.on(IPC_CHANNELS.SHOW_MAIN_WINDOW, () => {
    showMainWindow()
  })

  ipcMain.on(IPC_CHANNELS.QUIT_APP, () => {
    getTray()?.destroy()
    app.quit()
  })
}
