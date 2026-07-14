import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { setUserDataResolver } from './json-store'
import { loadConfig, saveConfig, getConfigPath } from './config'
import { defaultConfig } from '../shared/types'
import type { AppConfig } from '../shared/types'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'catdown-config-'))
  setUserDataResolver(() => tmpDir)
})

afterEach(() => {
  setUserDataResolver(null)
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('config - 读写与回退', () => {
  it('首次加载：返回默认配置并写入文件', () => {
    const config = loadConfig()
    expect(config).toEqual(defaultConfig)
    // 文件应已创建
    const raw = readFileSync(getConfigPath(), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultConfig)
  })

  it('保存后加载：返回保存的配置', () => {
    const custom: AppConfig = {
      ...defaultConfig,
      widgetName: '我的倒计时',
      workdays: [1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '19:00',
      monthlySalary: 25000
    }
    saveConfig(custom)
    const loaded = loadConfig()
    expect(loaded).toEqual(custom)
    expect(loaded.widgetName).toBe('我的倒计时')
    expect(loaded.monthlySalary).toBe(25000)
  })

  it('损坏的 JSON：回退默认配置并重写文件', () => {
    writeFileSync(getConfigPath(), '<<<not json>>>', 'utf-8')
    const config = loadConfig()
    expect(config).toEqual(defaultConfig)
    // 文件应被重写为默认值
    const raw = readFileSync(getConfigPath(), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultConfig)
  })

  it('部分配置（缺字段）：合并默认值补齐', () => {
    // 仅写 payday 与 widgetName，其余字段应回退默认
    writeFileSync(
      getConfigPath(),
      JSON.stringify({ payday: 15, widgetName: '部分' }),
      'utf-8'
    )
    const config = loadConfig()
    expect(config.payday).toBe(15)
    expect(config.widgetName).toBe('部分')
    // 缺失字段使用默认值
    expect(config.workdays).toEqual(defaultConfig.workdays)
    expect(config.startTime).toBe(defaultConfig.startTime)
    expect(config.showCat).toBe(defaultConfig.showCat)
  })

  it('background 配置规整：补齐 presetId 等', () => {
    // 写入一个 mode=preset 但缺 presetId 的配置
    writeFileSync(
      getConfigPath(),
      JSON.stringify({ background: { mode: 'preset', color: '#fff', imagePath: '', cropRatio: '16:9' } }),
      'utf-8'
    )
    const config = loadConfig()
    // sanitizeBackground 应补齐 presetId（回退到默认预设）
    expect(config.background.mode).toBe('preset')
    expect(config.background.presetId).toBeTruthy()
  })

  it('getConfigPath 指向 userData 目录', () => {
    expect(getConfigPath()).toBe(join(tmpDir, 'config.json'))
  })
})
