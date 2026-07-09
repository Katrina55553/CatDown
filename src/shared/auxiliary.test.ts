import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { calculateFriday, findNextHoliday } from './auxiliary'
import type { EngineConfig } from './engine'
import type { HolidayEntry } from './types'

const defaultConfig: EngineConfig = {
  workdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  holidays: []
}

describe('距离周五计算', () => {
  it('周三：距离周五还有2天', () => {
    // 2026-03-18 周三 14:00
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(2)
    expect(result.hours).toBe(4) // 14:00 → 周五 18:00 = 2天4小时
  })

  it('周一：距离周五还有4天', () => {
    // 2026-03-16 周一 10:00
    const now = dayjs('2026-03-16 10:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(4)
    expect(result.hours).toBe(8) // 10:00 → 周五 18:00 = 4天8小时
  })

  it('周五上班中：距离下班还有几小时', () => {
    // 2026-03-20 周五 14:00
    const now = dayjs('2026-03-20 14:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(0)
    expect(result.hours).toBe(4) // 14:00 → 18:00 = 4小时
    expect(result.formatted).toBe('还有 4 小时')
  })

  it('周五已下班：跳到下周五', () => {
    // 2026-03-20 周五 19:00
    const now = dayjs('2026-03-20 19:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(6)
    expect(result.hours).toBe(23) // 19:00 → 下周五 18:00 = 6天23小时
  })

  it('周六：距离下周五', () => {
    // 2026-03-21 周六 12:00
    const now = dayjs('2026-03-21 12:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(6)
    expect(result.hours).toBe(6) // 12:00 → 下周五 18:00 = 6天6小时
  })

  it('周日：距离周五', () => {
    // 2026-03-22 周日 12:00
    const now = dayjs('2026-03-22 12:00:00').toDate()
    const result = calculateFriday(now, defaultConfig)

    expect(result.days).toBe(5)
    expect(result.hours).toBe(6) // 12:00 → 周五 18:00 = 5天6小时
  })
})

describe('下一个节日查找', () => {
  const holidays: HolidayEntry[] = [
    { date: '2026-01-01', name: '元旦' },
    { date: '2026-04-04', name: '清明节' },
    { date: '2026-05-01', name: '劳动节' },
    { date: '2026-06-19', name: '端午节' },
    { date: '2026-10-01', name: '国庆节' }
  ]

  it('找到下一个节日', () => {
    // 2026-03-18 → 下一个节日是清明节 04-04
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = findNextHoliday(now, holidays)

    expect(result.found).toBe(true)
    expect(result.name).toBe('清明节')
    expect(result.daysUntil).toBe(17) // 3/18 → 4/4 = 17天
  })

  it('节日就是今天', () => {
    // 2026-04-04 清明节
    const now = dayjs('2026-04-04 08:00:00').toDate()
    const result = findNextHoliday(now, holidays)

    expect(result.found).toBe(true)
    expect(result.name).toBe('清明节')
    expect(result.daysUntil).toBe(0)
    expect(result.formatted).toBe('就是今天')
  })

  it('当年节日已过完：找明年第一个', () => {
    // 2026-12-25 → 下一个节日是明年元旦
    const now = dayjs('2026-12-25 14:00:00').toDate()
    const result = findNextHoliday(now, holidays)

    expect(result.found).toBe(true)
    expect(result.name).toBe('元旦')
    expect(result.daysUntil).toBe(7) // 12/25 → 1/1 = 7天
  })

  it('无节日数据', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = findNextHoliday(now, [])

    expect(result.found).toBe(false)
    expect(result.formatted).toBe('暂无节日数据')
  })

  it('多个同日期节日：返回第一个', () => {
    const holidaysWithDup: HolidayEntry[] = [
      { date: '2026-10-01', name: '国庆节' },
      { date: '2026-10-01', name: '中秋节' } // 同一天
    ]
    const now = dayjs('2026-09-15 14:00:00').toDate()
    const result = findNextHoliday(now, holidaysWithDup)

    expect(result.found).toBe(true)
    expect(result.name).toBe('国庆节') // 排序后第一个
  })
})
