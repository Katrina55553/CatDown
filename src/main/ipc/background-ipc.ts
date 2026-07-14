import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { selectImageFile, saveCroppedImage, readImageAsDataURL } from '../background'

/**
 * 注册背景图相关 IPC：
 * - BG_SELECT_IMAGE：打开文件选择对话框并校验
 * - BG_SAVE_IMAGE：保存裁剪后的 base64 图片到 userData/bg/
 * - BG_READ_IMAGE：读取背景图为 data URL
 */
export function registerBackgroundIpc(): void {
  ipcMain.handle(IPC_CHANNELS.BG_SELECT_IMAGE, async () => {
    return await selectImageFile()
  })

  ipcMain.handle(IPC_CHANNELS.BG_SAVE_IMAGE, (_event, base64Data: string, ext?: string) => {
    return saveCroppedImage(base64Data, ext)
  })

  ipcMain.handle(IPC_CHANNELS.BG_READ_IMAGE, (_event, relPath: string) => {
    return readImageAsDataURL(relPath)
  })
}
