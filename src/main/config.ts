import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { defaultConfig } from '../shared/types'
import type { AppConfig } from '../shared/types'

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

/**
 * 加载配置，不存在则创建默认配置
 */
export function loadConfig(): AppConfig {
  const configPath = getConfigPath()

  if (!existsSync(configPath)) {
    // 首次启动，创建默认配置
    saveConfig(defaultConfig)
    return { ...defaultConfig }
  }

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    // 合并默认值，确保新增字段有默认值
    return { ...defaultConfig, ...parsed }
  } catch (err) {
    // 配置损坏，回退到默认值
    console.error('配置文件解析失败，使用默认配置:', err)
    saveConfig(defaultConfig)
    return { ...defaultConfig }
  }
}

/**
 * 保存配置到本地文件
 */
export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath()
  const dir = app.getPath('userData')

  // 确保目录存在
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (err) {
    console.error('配置文件保存失败:', err)
  }
}
