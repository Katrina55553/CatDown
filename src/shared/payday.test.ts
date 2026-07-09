import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { calculatePayday, calculateActualPayday } from './payday'
import type { EngineConfig } from './engine'

const defaultConfig: EngineConfig = {
  workdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  holidays: []
}

describe('发薪日计算 - 基础场景', () => {
  it('当月发薪日尚未到达：正常倒计时', () => {
    // 2026-03-05，发薪日 10 号
    const now = dayjs('2026-03-05 14:00:00').toDate()
    const result = calculatePayday({
      now,
      payday: 10,
      advanceOnHoliday: false,
      config: defaultConfig
    })

    expect(result.daysUntil).toBe(5)
    expect(result.isToday).toBe(false)
    expect(result.formatted).toBe('还有 5 天')
  })

  it('发薪日就是今天', () => {
    // 2026-03-10，发薪日 10 号
    const now = dayjs('2026-03-10 14:00:00').toDate()
    const result = calculatePayday({
      now,
      payday: 10,
      advanceOnHoliday: false,
      config: defaultConfig
    })

    expect(result.isToday).toBe(true)
    expect(result.formatted).toBe('今天发薪日！')
  })

  it('当月发薪日已过：跳到下月', () => {
    // 2026-03-15，发薪日 10 号
    const now = dayjs('2026-03-15 14:00:00').toDate()
    const result = calculatePayday({
      now,
      payday: 10,
      advanceOnHoliday: false,
      config: defaultConfig
    })

    // 4月10日 - 3月15日 = 26天
    expect(result.daysUntil).toBe(26)
  })

  it('明天发薪', () => {
    // 2026-03-09，发薪日 10 号
    const now = dayjs('2026-03-09 14:00:00').toDate()
    const result = calculatePayday({
      now,
      payday: 10,
      advanceOnHoliday: false,
      config: defaultConfig
    })

    expect(result.daysUntil).toBe(1)
    expect(result.formatted).toBe('明天发薪')
  })
})

describe('发薪日计算 - 遇节假日提前', () => {
  it('发薪日落在周六：提前到周五', () => {
    // 2026-04-10 是周五 → 不需要提前
    // 2026-05-10 是周日 → 提前到周五 05-08
    const result = calculateActualPayday(2026, 5, 10, true, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-05-08')
  })

  it('发薪日落在周日：提前到周五', () => {
    // 2026-03-15 是周日 → 提前到周五 03-13
    const result = calculateActualPayday(2026, 3, 15, true, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-13')
  })

  it('发薪日落在工作日：不提前', () => {
    // 2026-03-10 是周二
    const result = calculateActualPayday(2026, 3, 10, true, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-10')
  })

  it('不开启提前：发薪日落在周末不提前', () => {
    // 2026-03-15 是周日
    const result = calculateActualPayday(2026, 3, 15, false, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-15')
  })

  it('发薪日落在节假日：提前到最近工作日', () => {
    const configWithHoliday: EngineConfig = {
      ...defaultConfig,
      holidays: ['2026-03-10'] // 周二变节假日
    }
    const result = calculateActualPayday(2026, 3, 10, true, configWithHoliday)
    // 03-10 是节假日 → 提前到 03-09（周一）
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-09')
  })

  it('连续节假日：提前到最近工作日', () => {
    const configWithHolidays: EngineConfig = {
      ...defaultConfig,
      holidays: ['2026-03-10', '2026-03-09', '2026-03-08'] // 连续3天
    }
    const result = calculateActualPayday(2026, 3, 10, true, configWithHolidays)
    // 03-10, 03-09, 03-08 都是节假日 → 03-07 是周五（工作日）
    // 但 03-07 是周六...实际 03-06 是周五
    // 2026-03-06 是周五
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-06')
  })
})

describe('发薪日计算 - 31号场景', () => {
  it('2月没有31号：取当月最后一天', () => {
    // 2026-02 最后一天是 28
    const result = calculateActualPayday(2026, 2, 31, false, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-02-28')
  })

  it('4月没有31号：取当月最后一天', () => {
    // 2026-04 最后一天是 30
    const result = calculateActualPayday(2026, 4, 31, false, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-04-30')
  })

  it('1月有31号：正常', () => {
    const result = calculateActualPayday(2026, 1, 31, false, defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-01-31')
  })
})

describe('发薪日计算 - 跨月倒计时', () => {
  it('12月底发薪日已过：跳到次年1月', () => {
    // 2026-12-25，发薪日 10 号
    const now = dayjs('2026-12-25 14:00:00').toDate()
    const result = calculatePayday({
      now,
      payday: 10,
      advanceOnHoliday: false,
      config: defaultConfig
    })

    // 1月10日 - 12月25日 = 16天
    expect(result.daysUntil).toBe(16)
    expect(result.actualPayday.format('YYYY-MM-DD')).toBe('2027-01-10')
  })
})
