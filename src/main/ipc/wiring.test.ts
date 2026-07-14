import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock electron：捕获 ipcMain.handle / ipcMain.on 调用
// vi.hoisted 确保 spy 在 vi.mock 工厂执行前就已初始化
const { handleSpy, onSpy } = vi.hoisted(() => ({
  handleSpy: vi.fn(),
  onSpy: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: { handle: handleSpy, on: onSpy },
  app: { getPath: vi.fn(() => ''), quit: vi.fn() },
  dialog: { showOpenDialog: vi.fn() }
}))

// mock 各 register 模块的依赖，避免触发真实 Electron API
vi.mock('../config', () => ({ loadConfig: vi.fn(), saveConfig: vi.fn() }))
vi.mock('../auto-start', () => ({ syncAutoStart: vi.fn() }))
vi.mock('../holidays', () => ({
  loadHolidayEntries: vi.fn(),
  addHoliday: vi.fn(),
  removeHoliday: vi.fn(),
  resetHolidays: vi.fn()
}))
vi.mock('../background', () => ({
  selectImageFile: vi.fn(),
  saveCroppedImage: vi.fn(),
  readImageAsDataURL: vi.fn()
}))
vi.mock('../tray', () => ({ getTray: vi.fn() }))

import { registerConfigIpc } from './config-ipc'
import { registerHolidayIpc } from './holiday-ipc'
import { registerBackgroundIpc } from './background-ipc'
import { registerWindowIpc } from './window-ipc'
import { IPC_CHANNELS } from '../../shared/types'

beforeEach(() => {
  handleSpy.mockClear()
  onSpy.mockClear()
})

/** 提取 handle 注册的通道名 */
function handledChannels(): string[] {
  return handleSpy.mock.calls.map((c) => c[0] as string)
}

/** 提取 on 注册的通道名 */
function onChannels(): string[] {
  return onSpy.mock.calls.map((c) => c[0] as string)
}

describe('IPC 注册接线', () => {
  it('registerConfigIpc：注册 GET_CONFIG 与 SET_CONFIG（handle）', () => {
    registerConfigIpc()
    expect(handledChannels()).toContain(IPC_CHANNELS.GET_CONFIG)
    expect(handledChannels()).toContain(IPC_CHANNELS.SET_CONFIG)
    expect(onChannels()).toHaveLength(0)
  })

  it('registerHolidayIpc：注册 4 个节假日 handle 通道', () => {
    registerHolidayIpc()
    const channels = handledChannels()
    expect(channels).toContain(IPC_CHANNELS.GET_HOLIDAYS)
    expect(channels).toContain(IPC_CHANNELS.ADD_HOLIDAY)
    expect(channels).toContain(IPC_CHANNELS.REMOVE_HOLIDAY)
    expect(channels).toContain(IPC_CHANNELS.RESET_HOLIDAYS)
  })

  it('registerBackgroundIpc：注册 3 个背景图 handle 通道', () => {
    registerBackgroundIpc()
    const channels = handledChannels()
    expect(channels).toContain(IPC_CHANNELS.BG_SELECT_IMAGE)
    expect(channels).toContain(IPC_CHANNELS.BG_SAVE_IMAGE)
    expect(channels).toContain(IPC_CHANNELS.BG_READ_IMAGE)
  })

  it('registerWindowIpc：注册 SHOW_MAIN_WINDOW 与 QUIT_APP（on）', () => {
    registerWindowIpc(() => {})
    const channels = onChannels()
    expect(channels).toContain(IPC_CHANNELS.SHOW_MAIN_WINDOW)
    expect(channels).toContain(IPC_CHANNELS.QUIT_APP)
    expect(handledChannels()).toHaveLength(0)
  })

  it('所有注册的通道名均在 IPC_CHANNELS 中定义（无硬编码魔法字符串）', () => {
    registerConfigIpc()
    registerHolidayIpc()
    registerBackgroundIpc()
    registerWindowIpc(() => {})

    const allChannels = [...handledChannels(), ...onChannels()]
    const definedChannels = Object.values(IPC_CHANNELS)
    for (const ch of allChannels) {
      expect(definedChannels).toContain(ch)
    }
  })
})
