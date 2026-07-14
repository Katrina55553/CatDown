import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

/**
 * 主进程 JSON 持久化模块。
 * 统一处理 userData 目录下 JSON 文件的读写、目录创建、解析异常回退与可选规整。
 */

let userDataResolver: (() => string) | null = null

/**
 * 注入自定义 userData 目录解析器。
 * 主要用于单元测试（指向临时目录），生产环境无需调用。
 */
export function setUserDataResolver(resolver: (() => string) | null): void {
  userDataResolver = resolver
}

/** 解析 userData 目录：优先用注入的 resolver，否则用 Electron userData */
function resolveUserDataDir(): string {
  if (userDataResolver) return userDataResolver()
  return app.getPath('userData')
}

/** 获取 userData 根目录（受 resolver 注入影响，测试时可指向临时目录） */
export function getUserDataDir(): string {
  return resolveUserDataDir()
}

/** 获取 userData 下指定文件的完整路径 */
export function getUserDataPath(filename: string): string {
  return join(resolveUserDataDir(), filename)
}

export interface JsonStoreOptions<T> {
  /** 文件名（相对于 userData 目录） */
  filename: string
  /** 默认值（文件不存在或损坏时回退） */
  defaultValue: T
  /** 校验解析结果，返回 false 则回退默认值。默认仅信任 JSON.parse 成功 */
  validate?: (parsed: unknown) => boolean
  /** 规整/合并解析结果，返回最终值。仅在校验通过后调用 */
  sanitize?: (parsed: unknown) => T
  /** 日志前缀，默认使用 filename */
  logLabel?: string
}

/**
 * 读取 userData 下的 JSON 文件。
 * - 文件不存在：写入默认值并返回其拷贝
 * - 解析失败或校验不通过：写入默认值并返回其拷贝
 * - 正常：返回 sanitize 后的结果（未提供 sanitize 则原样返回）
 */
export function readJson<T>(options: JsonStoreOptions<T>): T {
  const { filename, defaultValue, validate, sanitize, logLabel } = options
  const filePath = getUserDataPath(filename)
  const label = logLabel ?? filename

  if (!existsSync(filePath)) {
    writeJson(filename, defaultValue)
    return cloneDefault(defaultValue)
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) {
      console.error(`[${label}] 数据校验失败，回退到默认值`)
      writeJson(filename, defaultValue)
      return cloneDefault(defaultValue)
    }
    return sanitize ? sanitize(parsed) : (parsed as T)
  } catch (err) {
    console.error(`[${label}] 解析失败，回退到默认值:`, err)
    writeJson(filename, defaultValue)
    return cloneDefault(defaultValue)
  }
}

/**
 * 写入 JSON 到 userData 下的指定文件，自动确保目录存在。
 */
export function writeJson<T>(filename: string, data: T): void {
  const filePath = getUserDataPath(filename)
  const dir = resolveUserDataDir()

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`[${filename}] 保存失败:`, err)
  }
}

/** 浅拷贝默认值（与原 loadConfig/loadHolidays 行为一致） */
function cloneDefault<T>(defaultValue: T): T {
  if (defaultValue && typeof defaultValue === 'object') {
    return { ...defaultValue } as T
  }
  return defaultValue
}
