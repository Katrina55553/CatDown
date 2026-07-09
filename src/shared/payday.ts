import dayjs from 'dayjs'
import type { EngineConfig } from './engine'
import { isWorkday } from './engine'

/**
 * 发薪日计算输入
 */
export interface PaydayInput {
  now: Date
  payday: number // 每月几号（1-31）
  advanceOnHoliday: boolean // 遇节假日是否提前发
  config: EngineConfig
}

/**
 * 发薪日计算结果
 */
export interface PaydayResult {
  /** 实际发薪日期 */
  actualPayday: dayjs.Dayjs
  /** 距发薪日还有几天 */
  daysUntil: number
  /** 格式化显示文本 */
  formatted: string
  /** 是否是今天发薪 */
  isToday: boolean
}

/**
 * 获取某月某天，如果该月没有该天则取最后一天
 */
function getMonthDay(year: number, month: number, day: number): dayjs.Dayjs {
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth()
  const actualDay = Math.min(day, daysInMonth)
  return dayjs(`${year}-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`)
}

/**
 * 向前查找最近的工作日（用于遇节假日提前发）
 */
function findPreviousWorkday(date: dayjs.Dayjs, config: EngineConfig): dayjs.Dayjs {
  let current = date
  for (let i = 0; i < 366; i++) {
    if (isWorkday(current, config)) {
      return current
    }
    current = current.subtract(1, 'day')
  }
  return date
}

/**
 * 计算实际发薪日（考虑节假日提前）
 */
export function calculateActualPayday(
  year: number,
  month: number,
  payday: number,
  advanceOnHoliday: boolean,
  config: EngineConfig
): dayjs.Dayjs {
  const rawPayday = getMonthDay(year, month, payday)

  if (!advanceOnHoliday) {
    return rawPayday
  }

  // 如果发薪日不是工作日，向前找最近的工作日
  if (!isWorkday(rawPayday, config)) {
    return findPreviousWorkday(rawPayday, config)
  }

  return rawPayday
}

/**
 * 计算下一个发薪日倒计时
 */
export function calculatePayday(input: PaydayInput): PaydayResult {
  const { now, payday, advanceOnHoliday, config } = input
  const current = dayjs(now)

  // 先尝试当月发薪日
  let actualPayday = calculateActualPayday(
    current.year(),
    current.month() + 1,
    payday,
    advanceOnHoliday,
    config
  )

  // 如果当月发薪日已过，使用下月
  if (actualPayday.isBefore(current, 'day')) {
    const nextMonth = current.month() + 1 // 0-indexed, +1 = next month
    const nextYear = nextMonth > 11 ? current.year() + 1 : current.year()
    const nextMonthNum = nextMonth > 11 ? 1 : nextMonth + 1
    actualPayday = calculateActualPayday(
      nextYear,
      nextMonthNum,
      payday,
      advanceOnHoliday,
      config
    )
  }

  // 用日期差（忽略时间部分），取当天 00:00 计算
  const todayStart = current.startOf('day')
  const paydayStart = actualPayday.startOf('day')
  const daysUntil = paydayStart.diff(todayStart, 'day')
  const isToday = actualPayday.isSame(current, 'day')

  let formatted: string
  if (isToday) {
    formatted = '今天发薪日！'
  } else if (daysUntil === 1) {
    formatted = '明天发薪'
  } else {
    formatted = `还有 ${daysUntil} 天`
  }

  return {
    actualPayday,
    daysUntil,
    formatted,
    isToday
  }
}
