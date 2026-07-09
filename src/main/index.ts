import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { createTray, getTray } from './tray'
import { loadConfig, saveConfig } from './config'
import { loadHolidayEntries, loadHolidays, addHoliday, removeHoliday, resetHolidays } from './holidays'
import { IPC_CHANNELS } from '../shared/types'
import type { AppConfig } from '../shared/types'

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
    createWindow()
    mainWindow?.show()
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => {
    return loadConfig()
  })
  ipcMain.handle(IPC_CHANNELS.SET_CONFIG, (_event, config: Partial<AppConfig>) => {
    const current = loadConfig()
    const updated = { ...current, ...config }
    saveConfig(updated)
    return updated
  })
  ipcMain.on(IPC_CHANNELS.SHOW_MAIN_WINDOW, () => {
    showMainWindow()
  })
  ipcMain.on(IPC_CHANNELS.QUIT_APP, () => {
    getTray()?.destroy()
    app.quit()
  })

  // 节假日相关 IPC
  ipcMain.handle(IPC_CHANNELS.GET_HOLIDAYS, () => {
    return loadHolidayEntries()
  })
  ipcMain.handle(IPC_CHANNELS.ADD_HOLIDAY, (_event, date: string, name: string) => {
    return addHoliday(date, name)
  })
  ipcMain.handle(IPC_CHANNELS.REMOVE_HOLIDAY, (_event, date: string) => {
    return removeHoliday(date)
  })
  ipcMain.handle(IPC_CHANNELS.RESET_HOLIDAYS, () => {
    return resetHolidays()
  })
}

app.whenReady().then(() => {
  // 确保配置文件存在
  loadConfig()

  // 创建主窗口
  createWindow()

  // 创建托盘
  createTray(showMainWindow)

  // 注册 IPC
  registerIpc()
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
