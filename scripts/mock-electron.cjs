/**
 * Minimal Electron mock for unit tests.
 * Provides stubs for the Electron APIs used by src/main/* and src/preload/*.
 *
 * Pointed to via vitest.config.ts resolve.alias: { electron: '...' }
 */

const { tmpdir } = require('os')
const { join } = require('path')

const app = {
  getPath(name) {
    // 返回临时目录下的子路径，与生产环境结构类似
    if (name === 'userData') return join(tmpdir(), 'catdown-test-userdata')
    return tmpdir()
  },
  quit: () => {},
  isReady: () => true,
  whenReady: () => Promise.resolve(),
  on: () => {},
  getName: () => 'catdown',
  getVersion: () => '0.0.0-test'
}

const ipcMain = {
  handle: () => {},
  on: () => {},
  off: () => {},
  removeAllListeners: () => {}
}

const dialog = {
  showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
  showMessageBox: () => Promise.resolve({ response: 0 })
}

const BrowserWindow = function () {
  return {
    loadURL: () => {},
    loadFile: () => {},
    on: () => {},
    once: () => {},
    show: () => {},
    hide: () => {},
    close: () => {},
    destroy: () => {},
    isVisible: () => false,
    isDestroyed: () => false,
    setSkipTaskbar: () => {},
    webContents: { on: () => {}, send: () => {} }
  }
}

const Tray = function () {
  return {
    setToolTip: () => {},
    setContextMenu: () => {},
    on: () => {},
    destroy: () => {},
    setImage: () => {}
  }
}

const Menu = {
  buildFromTemplate: () => ({}),
  setApplicationMenu: () => {}
}

const session = {
  defaultSession: {}
}

const shell = {
  openExternal: () => Promise.resolve()
}

const nativeImage = {
  createFromPath: () => ({}),
  createEmpty: () => ({})
}

module.exports = {
  app,
  ipcMain,
  dialog,
  BrowserWindow,
  Tray,
  Menu,
  session,
  shell,
  nativeImage,
  // contextBridge / ipcRenderer 用于 preload 测试
  contextBridge: { exposeInMainWorld: () => {} },
  ipcRenderer: { invoke: () => Promise.resolve(), send: () => {}, on: () => {} }
}
