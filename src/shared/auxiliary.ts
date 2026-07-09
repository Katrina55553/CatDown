import dayjs from 'dayjs'
import type { EngineConfig } from './engine'
import { isWorkday } from './engine'
import type { HolidayEntry } from './types'

/**
 * 距离周五计算结果
 */
export interface FridayResult {
  days: number
  hours: number
  formatted: string
}

/**
 * 计算距离周五的时间
 * 目标：本周五的下班时间（如果周五是工作日），否则下一个周五
 */
export function calculateFriday(
  now: Date,
  config: EngineConfig
): FridayResult {
  const current = dayjs(now)
  const currentDay = current.day() // 0=周日, 5=周五

  // 计算到本周五的天数差
  let daysUntilFriday: number
  if (currentDay <= 5) {
    daysUntilFriday = 5 - currentDay
  } else {
    // 周六（6）→ 下周五 = 6天
    daysUntilFriday = 6
  }

  // 目标时间：本周五（或下周五）的下班时间
  const { hour: endHour, minute: endMinute } = parseTime(config.endTime)
  const targetFriday = current
    .add(daysUntilFriday, 'day')
    .hour(endHour)
    .minute(endMinute)
    .second(0)
    .millisecond(0)

  // 如果今天就是周五且已下班，目标改为下周五
  if (currentDay === 5 && current.isAfter(targetFriday)) {
    const nextFriday = current.add(7, 'day').hour(endHour).minute(endMinute).second(0).millisecond(0)
    const diffMs = nextFriday.valueOf() - current.valueOf()
    const totalHours = Math.floor(diffMs / 3600000)
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    return {
      days,
      hours,
      formatted: days >= 1 ? `还有 ${days} 天 ${hours} 小时` : `还有 ${hours} 小时`
    }
  }

  const diffMs = targetFriday.valueOf() - current.valueOf()
  const totalHours = Math.floor(diffMs / 3600000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  return {
    days,
    hours,
    formatted: days >= 1 ? `还有 ${days} 天 ${hours} 小时` : `还有 ${hours} 小时`
  }
}

/**
 * 下一个节日计算结果
 */
export interface NextHolidayResult {
  name: string
  date: string
  daysUntil: number
  formatted: string
  found: boolean
}

/**
 * 查找下一个节日
 * @param now 当前时间
 * @param holidays 节假日列表（已排序）
 */
export function findNextHoliday(
  now: Date,
  holidays: HolidayEntry[]
): NextHolidayResult {
  const current = dayjs(now)
  const todayStr = current.format('YYYY-MM-DD')

  // 找到第一个日期 >= 今天的节假日
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))

  for (const holiday of sorted) {
    if (holiday.date >= todayStr) {
      const holidayDate = dayjs(holiday.date)
      const daysUntil = holidayDate.diff(current.startOf('day'), 'day')
      return {
        name: holiday.name,
        date: holiday.date,
        daysUntil,
        formatted: daysUntil === 0 ? '就是今天' : `还有 ${daysUntil} 天`,
        found: true
      }
    }
  }

  // 如果当年没有更多节日，找明年同一个节日
  if (sorted.length > 0) {
    const firstHoliday = sorted[0]
    const firstDate = dayjs(firstHoliday.date)
    // 尝试明年同月同日
    const nextYearDate = firstDate.year(current.year() + 1)
    const daysUntil = nextYearDate.diff(current.startOf('day'), 'day')
    return {
      name: firstHoliday.name,
      date: nextYearDate.format('YYYY-MM-DD'),
      daysUntil,
      formatted: `还有 ${daysUntil} 天`,
      found: true
    }
  }

  return {
    name: '',
    date: '',
    daysUntil: 0,
    formatted: '暂无节日数据',
    found: false
  }
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number)
  return { hour, minute }
}
