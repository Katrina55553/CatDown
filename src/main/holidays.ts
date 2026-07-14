import { defaultHolidays } from './default-holidays'
import type { HolidayEntry } from '../shared/types'
import { readJson, writeJson, getUserDataPath } from './json-store'

const HOLIDAYS_FILENAME = 'holidays.json'

interface HolidayData {
  version: string
  lastUpdated: string
  holidays: HolidayEntry[]
}

/** 校验解析结果是否含合法的 holidays 数组 */
function isHolidayData(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null) return false
  const data = parsed as Partial<HolidayData>
  return Array.isArray(data.holidays)
}

/**
 * 获取用户自定义节假日文件路径
 */
export function getHolidayFilePath(): string {
  return getUserDataPath(HOLIDAYS_FILENAME)
}

/** 读取节假日完整数据（合并内置与用户自定义），损坏时回退默认 */
function loadHolidayData(): HolidayData {
  return readJson<HolidayData>({
    filename: HOLIDAYS_FILENAME,
    defaultValue: defaultHolidays,
    validate: isHolidayData,
    logLabel: '节假日数据'
  })
}

/**
 * 加载节假日日期列表
 */
export function loadHolidays(): string[] {
  return loadHolidayData().holidays.map((h) => h.date)
}

/**
 * 加载节假日完整数据（含名称）
 */
export function loadHolidayEntries(): HolidayEntry[] {
  return loadHolidayData().holidays
}

/**
 * 保存节假日数据
 */
export function saveHolidayData(data: HolidayData): void {
  writeJson(HOLIDAYS_FILENAME, data)
}

/**
 * 添加自定义节假日
 */
export function addHoliday(date: string, name: string): HolidayEntry[] {
  const entries = loadHolidayEntries()

  // 避免重复
  if (!entries.some((h) => h.date === date)) {
    entries.push({ date, name })
    entries.sort((a, b) => a.date.localeCompare(b.date))
  }

  saveHolidayData({
    version: 'custom',
    lastUpdated: new Date().toISOString().split('T')[0],
    holidays: entries
  })

  return entries
}

/**
 * 删除节假日
 */
export function removeHoliday(date: string): HolidayEntry[] {
  let entries = loadHolidayEntries()
  entries = entries.filter((h) => h.date !== date)

  saveHolidayData({
    version: 'custom',
    lastUpdated: new Date().toISOString().split('T')[0],
    holidays: entries
  })

  return entries
}

/**
 * 重置为默认节假日数据
 */
export function resetHolidays(): HolidayEntry[] {
  saveHolidayData(defaultHolidays)
  return defaultHolidays.holidays
}
