import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { setUserDataResolver } from './json-store'
import {
  loadHolidays,
  loadHolidayEntries,
  addHoliday,
  removeHoliday,
  resetHolidays,
  getHolidayFilePath
} from './holidays'
import { defaultHolidays } from './default-holidays'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'catdown-holidays-'))
  setUserDataResolver(() => tmpDir)
})

afterEach(() => {
  setUserDataResolver(null)
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('holidays - 加载与回退', () => {
  it('首次加载：返回默认节假日并写入文件', () => {
    const dates = loadHolidays()
    const entries = loadHolidayEntries()
    expect(dates.length).toBe(defaultHolidays.holidays.length)
    expect(entries.length).toBe(defaultHolidays.holidays.length)
    // 文件应已创建
    const raw = readFileSync(getHolidayFilePath(), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultHolidays)
  })

  it('损坏的 JSON：回退默认并重写', () => {
    writeFileSync(getHolidayFilePath(), 'not json', 'utf-8')
    const entries = loadHolidayEntries()
    expect(entries).toEqual(defaultHolidays.holidays)
    const raw = readFileSync(getHolidayFilePath(), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultHolidays)
  })

  it('holidays 字段非数组：回退默认', () => {
    writeFileSync(
      getHolidayFilePath(),
      JSON.stringify({ version: 'x', lastUpdated: 'x', holidays: 'not-array' }),
      'utf-8'
    )
    const entries = loadHolidayEntries()
    expect(entries).toEqual(defaultHolidays.holidays)
  })
})

describe('holidays - 增删重置', () => {
  it('addHoliday：新增并持久化，避免重复', () => {
    const before = loadHolidayEntries().length
    const after = addHoliday('2026-08-15', '自定义假')
    expect(after.some((h) => h.date === '2026-08-15' && h.name === '自定义假')).toBe(true)
    expect(after.length).toBe(before + 1)
    // 持久化：重新加载应包含新增项
    const reloaded = loadHolidayEntries()
    expect(reloaded.some((h) => h.date === '2026-08-15')).toBe(true)
  })

  it('addHoliday：重复添加同一日期不增加', () => {
    addHoliday('2026-08-16', '假A')
    const count1 = loadHolidayEntries().length
    addHoliday('2026-08-16', '假B') // 同日期，应被忽略
    const count2 = loadHolidayEntries().length
    expect(count2).toBe(count1)
  })

  it('addHoliday：按日期升序排序', () => {
    addHoliday('2026-12-31', '年末')
    addHoliday('2026-01-02', '年初')
    const entries = loadHolidayEntries()
    const idx1 = entries.findIndex((h) => h.date === '2026-01-02')
    const idx2 = entries.findIndex((h) => h.date === '2026-12-31')
    expect(idx1).toBeLessThan(idx2)
  })

  it('removeHoliday：删除并持久化', () => {
    addHoliday('2026-09-09', '待删假')
    expect(loadHolidayEntries().some((h) => h.date === '2026-09-09')).toBe(true)
    const after = removeHoliday('2026-09-09')
    expect(after.some((h) => h.date === '2026-09-09')).toBe(false)
    // 持久化：重新加载不应包含
    expect(loadHolidayEntries().some((h) => h.date === '2026-09-09')).toBe(false)
  })

  it('resetHolidays：恢复为默认数据', () => {
    addHoliday('2026-07-07', '临时假')
    expect(loadHolidayEntries().some((h) => h.date === '2026-07-07')).toBe(true)
    const after = resetHolidays()
    expect(after).toEqual(defaultHolidays.holidays)
    expect(loadHolidayEntries()).toEqual(defaultHolidays.holidays)
  })
})
