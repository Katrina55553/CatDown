import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { createTray, refreshTrayMenu } from './tray'
import type { TrayCallbacks } from './tray'
import { loadConfig, saveConfig } from './config'
import { syncAutoStart } from './auto-start'
import { createPetWindow, getPetWindow, togglePet, destroyPetWindow } from './pet-window'
import { registerConfigIpc } from './ipc/config-ipc'
import { registerHolidayIpc } from './ipc/holiday-ipc'
import { registerBackgroundIpc } from './ipc/background-ipc'
import { registerWindowIpc } from './ipc/window-ipc'

let settingsWindow: BrowserWindow | null = null

function createSettingsWindow(): void {
  settingsWindow = new BrowserWindow({
    width: 420,
    height: 600,
    show: false,
    frame: true,
    resizable: true,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // 开发环境加载 dev server，生产环境加载打包文件
  if (process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 阻止关闭，改为隐藏，保持托盘常驻
  settingsWindow.on('close', (e: Electron.Event) => {
    e.preventDefault()
    settingsWindow?.hide()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  // 外部链接用系统浏览器打开
  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

function showSettingsWindow(): void {
  if (!settingsWindow) {
    createSettingsWindow()
  }
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) {
      settingsWindow.restore()
    }
    settingsWindow.show()
    settingsWindow.focus()
  }
}

/** 切换开机自启：更新配置 + 同步系统 + 刷新托盘菜单 */
function toggleAutoStart(): void {
  const current = loadConfig()
  const newValue = !current.autoStart
  saveConfig({ ...current, autoStart: newValue })
  syncAutoStart(newValue)
  refreshTrayMenu(trayCallbacks)
}

/** 切换桌宠显示/隐藏 */
function handleTogglePet(): void {
  togglePet()
  const config = loadConfig()
  const petWin = getPetWindow()
  saveConfig({ ...config, petEnabled: petWin?.isVisible() ?? false })
}

const trayCallbacks: TrayCallbacks = {
  onShowMainWindow: showSettingsWindow,
  onTogglePet: handleTogglePet,
  onToggleAutoStart: toggleAutoStart,
  getAutoStart: () => loadConfig().autoStart,
  getPetEnabled: () => loadConfig().petEnabled
}

/** 注册全部 IPC（按功能拆分到 ipc/ 子模块） */
function registerAllIpc(): void {
  registerConfigIpc()
  registerHolidayIpc()
  registerBackgroundIpc()
  registerWindowIpc(showSettingsWindow)
}

app.whenReady().then(() => {
  // 确保配置文件存在
  const config = loadConfig()

  // 同步开机自启状态
  syncAutoStart(config.autoStart)

  // 创建桌宠窗口（透明悬浮）
  createPetWindow()

  // 创建设置窗口（隐藏，按需显示）
  createSettingsWindow()

  // 创建托盘
  createTray(trayCallbacks)

  // 注册 IPC
  registerAllIpc()
})

// macOS 激活时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createPetWindow()
    createSettingsWindow()
  }
})

// 所有窗口关闭时不退出（托盘常驻）
app.on('window-all-closed', () => {
  // 不退出，保持托盘
})

// 退出前清理桌宠窗口
app.on('before-quit', () => {
  destroyPetWindow()
})
