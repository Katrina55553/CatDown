import dayjs from 'dayjs'
import type { EngineConfig } from './engine'
import { isWorkday } from './engine'
import type { SalaryType } from './types'

/**
 * 收入计算输入
 */
export interface IncomeInput {
  now: Date
  /** 月薪（元），salaryType='monthly' 时使用 */
  monthlySalary: number
  /** 日薪（元），salaryType='daily' 时使用 */
  dailySalary: number
  /** 薪资类型 */
  salaryType: SalaryType
  config: EngineConfig
  decimals?: number
}

/**
 * 收入计算结果
 */
export interface IncomeResult {
  /** 今日已赚金额 */
  todayIncome: number
  /** 格式化后的金额字符串 */
  formatted: string
  /** 当月工作日天数 */
  workDaysInMonth: number
  /** 每天工作时长（小时） */
  workHoursPerDay: number
  /** 今日已工作时长（小时） */
  workedHoursToday: number
  /** 是否应该显示卡片 */
  shouldShow: boolean
  /** 提示文案 */
  hint: string
}

/**
 * 解析 "HH:MM" 为 { hour, minute }
 */
function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number)
  return { hour, minute }
}

/**
 * 计算当月工作日天数
 * 按用户配置的工作日，统计当前月份的工作日天数（不含节假日）
 */
export function countWorkDaysInMonth(
  monthDate: dayjs.Dayjs,
  config: EngineConfig
): number {
  const daysInMonth = monthDate.daysInMonth()
  let count = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = monthDate.date(day)
    if (isWorkday(date, config)) {
      count++
    }
  }

  return count
}

/**
 * 计算今天已工作时长（小时）
 */
export function calculateWorkedHoursToday(
  now: dayjs.Dayjs,
  config: EngineConfig
): number {
  // 非工作日
  if (!isWorkday(now, config)) {
    return 0
  }

  const { hour: startHour, minute: startMinute } = parseTime(config.startTime)
  const { hour: endHour, minute: endMinute } = parseTime(config.endTime)

  const todayStart = now.hour(startHour).minute(startMinute).second(0).millisecond(0)
  const todayEnd = now.hour(endHour).minute(endMinute).second(0).millisecond(0)

  const workHoursPerDay =
    (todayEnd.valueOf() - todayStart.valueOf()) / 3600000

  // 未上班
  if (now.isBefore(todayStart)) {
    return 0
  }

  // 已下班
  if (now.isAfter(todayEnd) || now.isSame(todayEnd)) {
    return workHoursPerDay
  }

  // 上班中
  const workedMs = now.valueOf() - todayStart.valueOf()
  return Math.min(workedMs / 3600000, workHoursPerDay)
}

/**
 * 计算每天工作时长（小时）
 */
export function calculateWorkHoursPerDay(config: EngineConfig): number {
  const { hour: startHour, minute: startMinute } = parseTime(config.startTime)
  const { hour: endHour, minute: endMinute } = parseTime(config.endTime)

  const startMs = startHour * 3600000 + startMinute * 60000
  const endMs = endHour * 3600000 + endMinute * 60000

  return (endMs - startMs) / 3600000
}

/**
 * 计算今天收入
 *
 * - 月薪模式：todayIncome = monthlySalary / workDaysInMonth / workHoursPerDay × workedHoursToday
 * - 日薪模式：todayIncome = dailySalary / workHoursPerDay × workedHoursToday
 */
export function calculateTodayIncome(input: IncomeInput): IncomeResult {
  const { now, monthlySalary, dailySalary, salaryType, config, decimals = 2 } = input
  const current = dayjs(now)

  const workDaysInMonth = countWorkDaysInMonth(current, config)
  const workHoursPerDay = calculateWorkHoursPerDay(config)
  const workedHoursToday = calculateWorkedHoursToday(current, config)

  // 根据薪资类型判断是否已设置
  const salaryValue = salaryType === 'monthly' ? monthlySalary : dailySalary
  if (!salaryValue || salaryValue <= 0) {
    return {
      todayIncome: 0,
      formatted: '¥0.00',
      workDaysInMonth,
      workHoursPerDay,
      workedHoursToday,
      shouldShow: false,
      hint: salaryType === 'monthly' ? '请先设置月薪' : '请先设置日薪'
    }
  }

  // 避免除以 0
  if (workHoursPerDay === 0) {
    return {
      todayIncome: 0,
      formatted: '¥0.00',
      workDaysInMonth,
      workHoursPerDay,
      workedHoursToday,
      shouldShow: false,
      hint: '工作时长配置有误'
    }
  }

  // 月薪模式还需要工作日天数
  if (salaryType === 'monthly' && workDaysInMonth === 0) {
    return {
      todayIncome: 0,
      formatted: '¥0.00',
      workDaysInMonth,
      workHoursPerDay,
      workedHoursToday,
      shouldShow: false,
      hint: '工作日配置有误'
    }
  }

  let todayIncome: number
  if (salaryType === 'monthly') {
    todayIncome = (monthlySalary / workDaysInMonth / workHoursPerDay) * workedHoursToday
  } else {
    todayIncome = (dailySalary / workHoursPerDay) * workedHoursToday
  }

  const formatted = `¥${todayIncome.toFixed(decimals)}`

  return {
    todayIncome,
    formatted,
    workDaysInMonth,
    workHoursPerDay,
    workedHoursToday,
    shouldShow: true,
    hint: salaryType === 'monthly'
      ? '按当月工作日折算，未扣税/五险一金，仅供参考'
      : '按今日工作时长折算，未扣税/五险一金，仅供参考'
  }
}
