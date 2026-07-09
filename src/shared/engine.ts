import dayjs from 'dayjs'
import type { AppConfig, CountdownResult, TargetEventType } from '../types'

/**
 * 引擎输入配置
 */
export interface EngineConfig {
  workdays: number[]
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  holidays: string[] // ["YYYY-MM-DD", ...]
}

/**
 * 引擎输入（不依赖 AppConfig，便于独立测试）
 */
export interface EngineInput {
  now: Date
  config: EngineConfig
}

/**
 * 解析 "HH:MM" 为 { hour, minute }
 */
function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number)
  return { hour, minute }
}

/**
 * 判断某天是否是工作日（工作日配置 + 节假日排除）
 */
export function isWorkday(date: dayjs.Dayjs, config: EngineConfig): boolean {
  const dayOfWeek = date.day() // 0=周日, 1=周一, ..., 6=周六
  if (!config.workdays.includes(dayOfWeek)) {
    return false
  }
  const dateStr = date.format('YYYY-MM-DD')
  if (config.holidays.includes(dateStr)) {
    return false
  }
  return true
}

/**
 * 从指定日期开始，查找下一个工作日
 * @param date 起始日期
 * @param config 引擎配置
 * @returns 下一个工作日的 dayjs 对象
 */
export function findNextWorkday(date: dayjs.Dayjs, config: EngineConfig): dayjs.Dayjs {
  let current = date.add(1, 'day')
  // 安全上限：防止无工作日配置时无限循环
  for (let i = 0; i < 366; i++) {
    if (isWorkday(current, config)) {
      return current
    }
    current = current.add(1, 'day')
  }
  // 366 天内没找到工作日，返回原日期（理论上不会发生，除非用户未设置任何工作日）
  return date
}

/**
 * 计算倒计时结果
 * 纯函数，不依赖任何运行时状态
 */
export function calculateCountdown(input: EngineInput): CountdownResult {
  const { now, config } = input
  const current = dayjs(now)
  const { hour: startHour, minute: startMinute } = parseTime(config.startTime)
  const { hour: endHour, minute: endMinute } = parseTime(config.endTime)

  // 未设置任何工作日
  if (config.workdays.length === 0) {
    return {
      eventType: 'noWorkday',
      targetTime: now,
      remainingMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: '请先设置工作日'
    }
  }

  const todayIsWorkday = isWorkday(current, config)

  // 今天的上班时间和下班时间
  const todayStart = current.hour(startHour).minute(startMinute).second(0).millisecond(0)
  const todayEnd = current.hour(endHour).minute(endMinute).second(0).millisecond(0)

  let eventType: TargetEventType
  let targetTime: dayjs.Dayjs

  if (todayIsWorkday) {
    if (current.isBefore(todayStart)) {
      // 工作日，尚未上班
      eventType = 'beforeWork'
      targetTime = todayStart
    } else if (current.isBefore(todayEnd)) {
      // 工作日，上班中
      eventType = 'working'
      targetTime = todayEnd
    } else {
      // 工作日，已下班 → 下一工作日上班时间
      eventType = 'afterWork'
      const nextWorkday = findNextWorkday(current, config)
      targetTime = nextWorkday
        .hour(startHour)
        .minute(startMinute)
        .second(0)
        .millisecond(0)
    }
  } else {
    // 非工作日 → 下一工作日上班时间
    eventType = 'restDay'
    const nextWorkday = findNextWorkday(current, config)
    targetTime = nextWorkday
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .millisecond(0)
  }

  // 计算剩余时间
  const diffMs = targetTime.valueOf() - current.valueOf()
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // 显示文案
  const label =
    eventType === 'working' ? '下班还有' : '距离上班还有'

  return {
    eventType,
    targetTime: targetTime.toDate(),
    remainingMs: diffMs,
    days,
    hours,
    minutes,
    seconds,
    label
  }
}

/**
 * 从 AppConfig 构建 EngineConfig
 */
export function buildEngineConfig(config: AppConfig, holidays: string[] = []): EngineConfig {
  return {
    workdays: config.workdays,
    startTime: config.startTime,
    endTime: config.endTime,
    holidays
  }
}
