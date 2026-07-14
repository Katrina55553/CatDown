import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { createTray, refreshTrayMenu } from './tray'
import type { TrayCallbacks } from './tray'
import { loadConfig, saveConfig } from './config'
import { syncAutoStart } from './auto-start'
import { registerConfigIpc } from './ipc/config-ipc'
import { registerHolidayIpc } from './ipc/holiday-ipc'
import { registerBackgroundIpc } from './ipc/background-ipc'
import { registerWindowIpc } from './ipc/window-ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 阻止关闭，改为隐藏，保持托盘常驻
  mainWindow.on('close', (e: Electron.Event) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

function showMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.show()
    mainWindow.focus()
  } else {
    // createWindow 内部 ready-to-show 事件会自动 show 窗口
    createWindow()
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

const trayCallbacks: TrayCallbacks = {
  onShowMainWindow: showMainWindow,
  onToggleAutoStart: toggleAutoStart,
  getAutoStart: () => loadConfig().autoStart
}

/** 注册全部 IPC（按功能拆分到 ipc/ 子模块） */
function registerAllIpc(): void {
  registerConfigIpc()
  registerHolidayIpc()
  registerBackgroundIpc()
  registerWindowIpc(showMainWindow)
}

app.whenReady().then(() => {
  // 确保配置文件存在
  const config = loadConfig()

  // 同步开机自启状态
  syncAutoStart(config.autoStart)

  // 创建主窗口
  createWindow()

  // 创建托盘
  createTray(trayCallbacks)

  // 注册 IPC
  registerAllIpc()
})

// macOS 激活时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 所有窗口关闭时不退出（托盘常驻）
app.on('window-all-closed', () => {
  // 不退出，保持托盘
})
