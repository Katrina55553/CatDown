import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

// 16x16 紫色方块图标的 data URL（开发阶段占位）
const FALLBACK_ICON_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAwUlEQVR42mNgGL6gh5gVFJ+' +
    'BkZGRTFgYGBgYGBiY/v//j+efP3/+HD16DCZmBgYGRkZGf4b//v1D4b9/JkaGf4YBVAX' +
    'Rw79/ExQ0v3/8+I9hg24GBgYmJqZ/jP7//4/i/38YkAEWAAAATklEQVR42mNgGK4gBQXF' +
    'J4TgvmIGBkYmRkYGRiamOcYGBgZGJiZGJkZGJiYGRiamBkYmBiZGJgYmRkYmJgYGRiY' +
    'GBkYGJj/PwADG1iZAABVGwd4NvQ5/gAAAABJRU5ErkJggg==',
  'base64'
)

/**
 * 创建系统托盘图标
 * @param onShowMainWindow 点击托盘图标时显示主窗口的回调
 */
export function createTray(onShowMainWindow: () => void): void {
  const iconPath = join(app.getAppPath(), 'resources', 'tray-dark.png')

  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      // 图标文件不存在时使用 data URL 占位图标
      icon = nativeImage.createFromBuffer(FALLBACK_ICON_PNG)
    }
  } catch {
    icon = nativeImage.createFromBuffer(FALLBACK_ICON_PNG)
  }

  // 缩放到托盘图标合适大小
  const resizedIcon = icon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('CatDown - 下班倒计时')

  // 左键点击显示主窗口
  tray.on('click', () => {
    onShowMainWindow()
  })

  // 右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: (): void => {
        onShowMainWindow()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: (): void => {
        tray?.destroy()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function getTray(): Tray | null {
  return tray
}
