import { defaultConfig } from '../shared/types'
import type { AppConfig } from '../shared/types'
import { sanitizeBackground } from '../shared/background-presets'
import { readJson, writeJson, getUserDataPath } from './json-store'

const CONFIG_FILENAME = 'config.json'

/** 判断解析结果是否为合法的（部分）配置对象 */
function isConfigLike(parsed: unknown): boolean {
  return typeof parsed === 'object' && parsed !== null
}

/** 合并默认值并规整背景配置（补齐 presetId、迁移旧默认粉色到预设模式） */
function sanitizeConfig(parsed: unknown): AppConfig {
  const merged = { ...defaultConfig, ...(parsed as Partial<AppConfig>) }
  merged.background = sanitizeBackground(merged.background)
  return merged
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return getUserDataPath(CONFIG_FILENAME)
}

/**
 * 加载配置，不存在或损坏则创建/回退默认配置
 */
export function loadConfig(): AppConfig {
  return readJson<AppConfig>({
    filename: CONFIG_FILENAME,
    defaultValue: defaultConfig,
    validate: isConfigLike,
    sanitize: sanitizeConfig,
    logLabel: '配置文件'
  })
}

/**
 * 保存配置到本地文件
 */
export function saveConfig(config: AppConfig): void {
  writeJson(CONFIG_FILENAME, config)
}
