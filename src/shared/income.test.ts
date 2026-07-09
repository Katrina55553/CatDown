import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  calculateTodayIncome,
  countWorkDaysInMonth,
  calculateWorkedHoursToday,
  calculateWorkHoursPerDay
} from './income'
import type { EngineConfig } from './engine'

const defaultConfig: EngineConfig = {
  workdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  holidays: []
}

describe('收入计算引擎 - 月薪基础场景', () => {
  it('工作日上班中：金额随时间增长', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.shouldShow).toBe(true)
    expect(result.workDaysInMonth).toBe(22)
    expect(result.workHoursPerDay).toBe(9)
    expect(result.workedHoursToday).toBe(5)
    expect(result.todayIncome).toBeCloseTo(252.53, 1)
  })

  it('工作日已下班：金额为满额', () => {
    const now = dayjs('2026-03-18 19:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.workedHoursToday).toBe(9)
    expect(result.todayIncome).toBeCloseTo(454.55, 1)
  })

  it('工作日未上班：金额为 0', () => {
    const now = dayjs('2026-03-18 07:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.workedHoursToday).toBe(0)
    expect(result.todayIncome).toBe(0)
    expect(result.shouldShow).toBe(true)
  })

  it('非工作日：金额为 0', () => {
    const now = dayjs('2026-03-21 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.workedHoursToday).toBe(0)
    expect(result.todayIncome).toBe(0)
    expect(result.shouldShow).toBe(true)
  })
})

describe('收入计算引擎 - 日薪场景', () => {
  it('工作日上班中：金额随时间增长', () => {
    // 日薪 500，9:00-18:00 共 9 小时，14:00 已工作 5 小时
    // 500 / 9 × 5 ≈ 277.78
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.shouldShow).toBe(true)
    expect(result.workHoursPerDay).toBe(9)
    expect(result.workedHoursToday).toBe(5)
    expect(result.todayIncome).toBeCloseTo(277.78, 1)
  })

  it('工作日已下班：金额为日薪满额', () => {
    const now = dayjs('2026-03-18 19:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.todayIncome).toBe(500)
  })

  it('工作日未上班：金额为 0', () => {
    const now = dayjs('2026-03-18 07:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.todayIncome).toBe(0)
    expect(result.shouldShow).toBe(true)
  })

  it('非工作日：金额为 0', () => {
    const now = dayjs('2026-03-21 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.todayIncome).toBe(0)
    expect(result.shouldShow).toBe(true)
  })

  it('hint 文案区分日薪模式', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.hint).toContain('今日工作时长')
  })

  it('日薪未设置：不显示卡片', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 0,
      salaryType: 'daily',
      config: defaultConfig
    })

    expect(result.shouldShow).toBe(false)
    expect(result.hint).toBe('请先设置日薪')
  })

  it('日薪模式下工作日为空：仍可显示（日薪不依赖工作日天数）', () => {
    const noWorkdayConfig: EngineConfig = {
      workdays: [],
      startTime: '09:00',
      endTime: '18:00',
      holidays: []
    }
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 500,
      salaryType: 'daily',
      config: noWorkdayConfig
    })

    // 当天不是工作日（workdays 为空），workedHoursToday 应为 0
    expect(result.workedHoursToday).toBe(0)
    expect(result.todayIncome).toBe(0)
  })
})

describe('收入计算引擎 - 边界场景', () => {
  it('月薪未设置：不显示卡片', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 0,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.shouldShow).toBe(false)
    expect(result.hint).toBe('请先设置月薪')
  })

  it('月薪为负数：不显示卡片', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: -1000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig
    })

    expect(result.shouldShow).toBe(false)
  })

  it('未设置任何工作日：月薪模式不显示卡片', () => {
    const noWorkdayConfig: EngineConfig = {
      workdays: [],
      startTime: '09:00',
      endTime: '18:00',
      holidays: []
    }
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: noWorkdayConfig
    })

    expect(result.shouldShow).toBe(false)
    expect(result.workDaysInMonth).toBe(0)
  })

  it('自定义上下班时间 9:30-18:30', () => {
    const customConfig: EngineConfig = {
      workdays: [1, 2, 3, 4, 5],
      startTime: '09:30',
      endTime: '18:30',
      holidays: []
    }
    const now = dayjs('2026-03-18 15:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: customConfig
    })

    expect(result.workHoursPerDay).toBe(9)
    expect(result.workedHoursToday).toBe(5.5)
    expect(result.todayIncome).toBeCloseTo(277.78, 1)
  })

  it('格式化金额保留 2 位小数', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig,
      decimals: 2
    })

    expect(result.formatted).toMatch(/^¥\d+\.\d{2}$/)
  })

  it('格式化金额保留 0 位小数', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: defaultConfig,
      decimals: 0
    })

    expect(result.formatted).toBe('¥253')
  })

  it('节假日影响当月工作日天数（月薪模式）', () => {
    const configWithHolidays: EngineConfig = {
      workdays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      holidays: ['2026-03-18', '2026-03-19', '2026-03-20']
    }
    const now = dayjs('2026-03-17 14:00:00').toDate()
    const result = calculateTodayIncome({
      now,
      monthlySalary: 10000,
      dailySalary: 0,
      salaryType: 'monthly',
      config: configWithHolidays
    })

    expect(result.workDaysInMonth).toBe(19)
  })
})

describe('辅助函数测试', () => {
  it('countWorkDaysInMonth: 2026-03 有 22 个工作日', () => {
    const result = countWorkDaysInMonth(dayjs('2026-03-01'), defaultConfig)
    expect(result).toBe(22)
  })

  it('countWorkDaysInMonth: 2026-02 有 20 个工作日', () => {
    const result = countWorkDaysInMonth(dayjs('2026-02-01'), defaultConfig)
    expect(result).toBe(20)
  })

  it('calculateWorkHoursPerDay: 09:00-18:00 = 9小时', () => {
    expect(calculateWorkHoursPerDay(defaultConfig)).toBe(9)
  })

  it('calculateWorkHoursPerDay: 09:30-18:30 = 9小时', () => {
    const customConfig: EngineConfig = {
      ...defaultConfig,
      startTime: '09:30',
      endTime: '18:30'
    }
    expect(calculateWorkHoursPerDay(customConfig)).toBe(9)
  })

  it('calculateWorkedHoursToday: 上班中 14:00 → 5小时', () => {
    const now = dayjs('2026-03-18 14:00:00')
    expect(calculateWorkedHoursToday(now, defaultConfig)).toBe(5)
  })

  it('calculateWorkedHoursToday: 已下班 19:00 → 9小时', () => {
    const now = dayjs('2026-03-18 19:00:00')
    expect(calculateWorkedHoursToday(now, defaultConfig)).toBe(9)
  })

  it('calculateWorkedHoursToday: 未上班 07:00 → 0小时', () => {
    const now = dayjs('2026-03-18 07:00:00')
    expect(calculateWorkedHoursToday(now, defaultConfig)).toBe(0)
  })
})
