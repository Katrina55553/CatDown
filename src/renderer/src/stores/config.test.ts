import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigStore } from './config'
import { defaultConfig } from '@shared/types'
import type { AppConfig, HolidayEntry } from '@shared/types'

interface MockApi {
  getConfig: ReturnType<typeof vi.fn>
  setConfig: ReturnType<typeof vi.fn>
  getHolidays: ReturnType<typeof vi.fn>
  readBackgroundImage: ReturnType<typeof vi.fn>
}

let mockApi: MockApi
// 测试环境通过 globalThis 注入 mock window，避开 DOM 类型冲突
let originalWindow: unknown

beforeEach(() => {
  setActivePinia(createPinia())
  mockApi = {
    getConfig: vi.fn(),
    setConfig: vi.fn(),
    getHolidays: vi.fn(),
    readBackgroundImage: vi.fn()
  }
  const g = globalThis as Record<string, unknown>
  originalWindow = g.window
  g.window = { catdown: mockApi }
})

afterEach(() => {
  const g = globalThis as Record<string, unknown>
  if (originalWindow === undefined) {
    delete g.window
  } else {
    g.window = originalWindow
  }
})

const sampleEntries: HolidayEntry[] = [
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-10-01', name: '国庆节' }
]

describe('config store - loadConfig 成功路径', () => {
  it('加载配置与节假日，非图片模式 backgroundUrl 为空', async () => {
    const custom: AppConfig = { ...defaultConfig, widgetName: '测试', payday: 20 }
    mockApi.getConfig.mockResolvedValue(custom)
    mockApi.getHolidays.mockResolvedValue(sampleEntries)

    const store = useConfigStore()
    await store.loadConfig()

    expect(store.config).toEqual(custom)
    expect(store.holidayEntries).toEqual(sampleEntries)
    expect(store.holidays).toEqual(['2026-01-01', '2026-10-01'])
    expect(store.backgroundUrl).toBe('')
    expect(store.loaded).toBe(true)
  })

  it('图片模式：读取背景图 data URL', async () => {
    const custom: AppConfig = {
      ...defaultConfig,
      background: { ...defaultConfig.background, mode: 'image', imagePath: 'background.png' }
    }
    mockApi.getConfig.mockResolvedValue(custom)
    mockApi.getHolidays.mockResolvedValue([])
    mockApi.readBackgroundImage.mockResolvedValue('data:image/png;base64,xxx')

    const store = useConfigStore()
    await store.loadConfig()

    expect(store.backgroundUrl).toBe('data:image/png;base64,xxx')
    expect(mockApi.readBackgroundImage).toHaveBeenCalledWith('background.png')
  })

  it('图片模式但读取返回 null：backgroundUrl 为空', async () => {
    const custom: AppConfig = {
      ...defaultConfig,
      background: { ...defaultConfig.background, mode: 'image', imagePath: 'missing.png' }
    }
    mockApi.getConfig.mockResolvedValue(custom)
    mockApi.getHolidays.mockResolvedValue([])
    mockApi.readBackgroundImage.mockResolvedValue(null)

    const store = useConfigStore()
    await store.loadConfig()

    expect(store.backgroundUrl).toBe('')
  })
})

describe('config store - loadConfig 失败路径', () => {
  it('getConfig 抛错：回退默认配置，loaded 仍为 true', async () => {
    mockApi.getConfig.mockRejectedValue(new Error('ipc 失败'))
    mockApi.getHolidays.mockResolvedValue([])

    const store = useConfigStore()
    await store.loadConfig()

    expect(store.config).toEqual(defaultConfig)
    expect(store.loaded).toBe(true)
    // 失败时不继续加载节假日与背景
    expect(store.holidays).toEqual([])
  })
})

describe('config store - updateConfig', () => {
  it('成功：更新 config 为返回值', async () => {
    const updated = { ...defaultConfig, payday: 15 }
    mockApi.setConfig.mockResolvedValue(updated)

    const store = useConfigStore()
    await store.updateConfig({ payday: 15 })

    expect(store.config).toEqual(updated)
    expect(mockApi.setConfig).toHaveBeenCalledWith({ payday: 15 })
  })

  it('失败：吞掉错误不抛出', async () => {
    mockApi.setConfig.mockRejectedValue(new Error('保存失败'))
    const store = useConfigStore()
    await expect(store.updateConfig({ payday: 15 })).resolves.toBeUndefined()
  })
})

describe('config store - refreshHolidays', () => {
  it('成功：刷新节假日列表', async () => {
    mockApi.getHolidays.mockResolvedValue(sampleEntries)
    const store = useConfigStore()
    await store.refreshHolidays()
    expect(store.holidayEntries).toEqual(sampleEntries)
    expect(store.holidays).toEqual(['2026-01-01', '2026-10-01'])
  })

  it('失败：吞掉错误不抛出', async () => {
    mockApi.getHolidays.mockRejectedValue(new Error('失败'))
    const store = useConfigStore()
    await expect(store.refreshHolidays()).resolves.toBeUndefined()
  })
})

describe('config store - refreshBackgroundUrl', () => {
  it('非图片模式：清空 backgroundUrl', async () => {
    const store = useConfigStore()
    store.config = { ...defaultConfig, background: { ...defaultConfig.background, mode: 'color' } }
    store.backgroundUrl = 'stale-data-url'
    await store.refreshBackgroundUrl()
    expect(store.backgroundUrl).toBe('')
    expect(mockApi.readBackgroundImage).not.toHaveBeenCalled()
  })

  it('图片模式：读取并设置 data URL', async () => {
    mockApi.readBackgroundImage.mockResolvedValue('data:image/png;base64,abc')
    const store = useConfigStore()
    store.config = {
      ...defaultConfig,
      background: { ...defaultConfig.background, mode: 'image', imagePath: 'bg.png' }
    }
    await store.refreshBackgroundUrl()
    expect(store.backgroundUrl).toBe('data:image/png;base64,abc')
    expect(mockApi.readBackgroundImage).toHaveBeenCalledWith('bg.png')
  })

  it('图片模式但返回 null：backgroundUrl 为空', async () => {
    mockApi.readBackgroundImage.mockResolvedValue(null)
    const store = useConfigStore()
    store.config = {
      ...defaultConfig,
      background: { ...defaultConfig.background, mode: 'image', imagePath: 'bg.png' }
    }
    await store.refreshBackgroundUrl()
    expect(store.backgroundUrl).toBe('')
  })
})
