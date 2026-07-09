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

export interface TrayCallbacks {
  onShowMainWindow: () => void
  onToggleAutoStart: () => void
  getAutoStart: () => boolean
}

/**
 * 构建托盘右键菜单
 */
function buildContextMenu(callbacks: TrayCallbacks): Electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: (): void => callbacks.onShowMainWindow()
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: callbacks.getAutoStart(),
      click: (menuItem): void => {
        callbacks.onToggleAutoStart()
        // 同步勾选状态
        menuItem.checked = callbacks.getAutoStart()
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
}

/**
 * 创建系统托盘图标
 */
export function createTray(callbacks: TrayCallbacks): void {
  const iconPath = join(app.getAppPath(), 'resources', 'tray-dark.png')

  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      icon = nativeImage.createFromBuffer(FALLBACK_ICON_PNG)
    }
  } catch {
    icon = nativeImage.createFromBuffer(FALLBACK_ICON_PNG)
  }

  const resizedIcon = icon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('CatDown - 下班倒计时')

  tray.on('click', () => {
    callbacks.onShowMainWindow()
  })

  tray.setContextMenu(buildContextMenu(callbacks))
}

/**
 * 刷新托盘菜单（开机自启状态变化后调用）
 */
export function refreshTrayMenu(callbacks: TrayCallbacks): void {
  if (tray) {
    tray.setContextMenu(buildContextMenu(callbacks))
  }
}

export function getTray(): Tray | null {
  return tray
}
