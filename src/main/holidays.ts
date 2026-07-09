import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { defaultHolidays } from './default-holidays'

export interface HolidayEntry {
  date: string // "YYYY-MM-DD"
  name: string
}

interface HolidayData {
  version: string
  lastUpdated: string
  holidays: HolidayEntry[]
}

/**
 * 获取用户自定义节假日文件路径
 */
export function getHolidayFilePath(): string {
  return join(app.getPath('userData'), 'holidays.json')
}

/**
 * 加载节假日数据
 * 合并内置数据与用户自定义数据
 */
export function loadHolidays(): string[] {
  const filePath = getHolidayFilePath()

  // 如果用户文件不存在，从内置默认数据创建
  if (!existsSync(filePath)) {
    saveHolidayData(defaultHolidays)
    return defaultHolidays.holidays.map((h) => h.date)
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as HolidayData

    if (!data.holidays || !Array.isArray(data.holidays)) {
      // 数据损坏，回退到默认
      saveHolidayData(defaultHolidays)
      return defaultHolidays.holidays.map((h) => h.date)
    }

    return data.holidays.map((h) => h.date)
  } catch (err) {
    // 解析失败，回退到默认
    console.error('节假日数据解析失败，使用默认数据:', err)
    saveHolidayData(defaultHolidays)
    return defaultHolidays.holidays.map((h) => h.date)
  }
}

/**
 * 加载节假日完整数据（含名称）
 */
export function loadHolidayEntries(): HolidayEntry[] {
  const filePath = getHolidayFilePath()

  if (!existsSync(filePath)) {
    saveHolidayData(defaultHolidays)
    return defaultHolidays.holidays
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as HolidayData
    if (!data.holidays || !Array.isArray(data.holidays)) {
      saveHolidayData(defaultHolidays)
      return defaultHolidays.holidays
    }
    return data.holidays
  } catch {
    saveHolidayData(defaultHolidays)
    return defaultHolidays.holidays
  }
}

/**
 * 保存节假日数据
 */
export function saveHolidayData(data: HolidayData): void {
  const filePath = getHolidayFilePath()
  const dir = app.getPath('userData')

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('节假日数据保存失败:', err)
  }
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
