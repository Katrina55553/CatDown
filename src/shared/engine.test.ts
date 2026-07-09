import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { calculateCountdown, findNextWorkday, isWorkday } from './engine'
import type { EngineConfig } from './engine'

// 默认测试配置：周一到周五，09:00-18:00，无节假日
const defaultConfig: EngineConfig = {
  workdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  holidays: []
}

describe('时间目标计算引擎 - 基础场景', () => {
  it('工作日上班前：目标为当天上班时间', () => {
    // 周三 08:00 → 目标 09:00
    const now = dayjs('2026-03-18 08:00:00').toDate() // 2026-03-18 是周三
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('beforeWork')
    expect(result.label).toBe('距离上班还有')
    expect(result.hours).toBe(1)
    expect(result.minutes).toBe(0)
    expect(result.days).toBe(0)
  })

  it('工作日上班中：目标为当天下班时间', () => {
    // 周三 14:30 → 目标 18:00
    const now = dayjs('2026-03-18 14:30:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('working')
    expect(result.label).toBe('下班还有')
    expect(result.hours).toBe(3)
    expect(result.minutes).toBe(30)
    expect(result.days).toBe(0)
  })

  it('工作日上班中：剩余精确到秒', () => {
    // 周三 17:59:30 → 目标 18:00
    const now = dayjs('2026-03-18 17:59:30').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('working')
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(30)
  })

  it('工作日已下班：目标为下一工作日上班时间', () => {
    // 周三 19:00 → 目标 周四 09:00
    const now = dayjs('2026-03-18 19:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('afterWork')
    expect(result.label).toBe('距离上班还有')
    expect(result.days).toBe(0)
    expect(result.hours).toBe(14) // 19:00 → 09:00 = 14小时
  })
})

describe('时间目标计算引擎 - 跨夜/跨周末', () => {
  it('周五下班后：目标跳到下周一上班', () => {
    // 周五 19:00 → 目标 下周一 09:00
    // 2026-03-20 是周五
    const now = dayjs('2026-03-20 19:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('afterWork')
    expect(result.label).toBe('距离上班还有')
    expect(result.days).toBe(2) // 周五到周一 = 2天
    expect(result.hours).toBe(14) // 19:00 → 09:00 = 14小时
  })

  it('周五上班中：仍显示当天下班倒计时', () => {
    // 周五 17:00 → 目标 18:00
    const now = dayjs('2026-03-20 17:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('working')
    expect(result.label).toBe('下班还有')
    expect(result.hours).toBe(1)
    expect(result.days).toBe(0)
  })

  it('周六：目标为下周一上班', () => {
    // 2026-03-21 是周六
    const now = dayjs('2026-03-21 10:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('restDay')
    expect(result.label).toBe('距离上班还有')
    expect(result.days).toBe(1) // 周六 → 周一 = 1天（周六10点到周一9点 ≈ 1天23小时）
    expect(result.hours).toBe(23) // 10:00 → 09:00 = 23小时
  })

  it('周日：目标为下周一上班', () => {
    // 2026-03-22 是周日
    const now = dayjs('2026-03-22 14:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('restDay')
    expect(result.label).toBe('距离上班还有')
    expect(result.days).toBe(0)
    expect(result.hours).toBe(19) // 14:00 → 09:00 = 19小时
  })
})

describe('时间目标计算引擎 - 跨月', () => {
  it('1月31日（周五）下班后：目标为2月2日（周一）上班', () => {
    // 2026-01-30 是周五
    const now = dayjs('2026-01-30 19:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('afterWork')
    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-02-02 09:00:00').toISOString()
    )
  })

  it('2月28日（周六）：目标为3月2日（周一）上班', () => {
    // 2026-02-28 是周六
    const now = dayjs('2026-02-28 12:00:00').toDate()
    const result = calculateCountdown({ now, config: defaultConfig })

    expect(result.eventType).toBe('restDay')
    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-03-02 09:00:00').toISOString()
    )
  })
})

describe('时间目标计算引擎 - 全周工作', () => {
  const allWeekConfig: EngineConfig = {
    workdays: [0, 1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '18:00',
    holidays: []
  }

  it('周日上班中：目标为当天下班', () => {
    // 2026-03-22 是周日
    const now = dayjs('2026-03-22 14:00:00').toDate()
    const result = calculateCountdown({ now, config: allWeekConfig })

    expect(result.eventType).toBe('working')
    expect(result.label).toBe('下班还有')
  })

  it('周日下午下班后：目标为周一上班', () => {
    const now = dayjs('2026-03-22 19:00:00').toDate()
    const result = calculateCountdown({ now, config: allWeekConfig })

    expect(result.eventType).toBe('afterWork')
    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-03-23 09:00:00').toISOString()
    )
  })
})

describe('时间目标计算引擎 - 未设置工作日', () => {
  const noWorkdayConfig: EngineConfig = {
    workdays: [],
    startTime: '09:00',
    endTime: '18:00',
    holidays: []
  }

  it('未设置任何工作日：返回提示状态', () => {
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateCountdown({ now, config: noWorkdayConfig })

    expect(result.eventType).toBe('noWorkday')
    expect(result.label).toBe('请先设置工作日')
    expect(result.remainingMs).toBe(0)
  })
})

describe('时间目标计算引擎 - 自定义上下班时间', () => {
  const customConfig: EngineConfig = {
    workdays: [1, 2, 3, 4, 5],
    startTime: '09:30',
    endTime: '18:30',
    holidays: []
  }

  it('9:30-18:30 配置：上班前', () => {
    // 周三 09:00 → 目标 09:30
    const now = dayjs('2026-03-18 09:00:00').toDate()
    const result = calculateCountdown({ now, config: customConfig })

    expect(result.eventType).toBe('beforeWork')
    expect(result.minutes).toBe(30)
  })

  it('9:30-18:30 配置：上班中', () => {
    // 周三 15:00 → 目标 18:30
    const now = dayjs('2026-03-18 15:00:00').toDate()
    const result = calculateCountdown({ now, config: customConfig })

    expect(result.eventType).toBe('working')
    expect(result.hours).toBe(3)
    expect(result.minutes).toBe(30)
  })

  it('9:30-18:30 配置：下班后', () => {
    // 周三 19:00 → 目标 周四 09:30
    const now = dayjs('2026-03-18 19:00:00').toDate()
    const result = calculateCountdown({ now, config: customConfig })

    expect(result.eventType).toBe('afterWork')
    expect(result.hours).toBe(14) // 19:00 → 09:30 = 14小时30分钟
    expect(result.minutes).toBe(30)
  })
})

describe('isWorkday 辅助函数', () => {
  it('周一到周五为工作日', () => {
    expect(isWorkday(dayjs('2026-03-18'), defaultConfig)).toBe(true) // 周三
  })

  it('周六不是工作日', () => {
    expect(isWorkday(dayjs('2026-03-21'), defaultConfig)).toBe(false)
  })

  it('节假日不是工作日', () => {
    const configWithHoliday: EngineConfig = {
      ...defaultConfig,
      holidays: ['2026-03-18']
    }
    expect(isWorkday(dayjs('2026-03-18'), configWithHoliday)).toBe(false)
  })
})

describe('findNextWorkday 辅助函数', () => {
  it('周三下班后：下一工作日为周四', () => {
    const result = findNextWorkday(dayjs('2026-03-18 19:00:00'), defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-19')
  })

  it('周五下班后：下一工作日为下周一', () => {
    const result = findNextWorkday(dayjs('2026-03-20 19:00:00'), defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-23')
  })

  it('周六：下一工作日为下周一', () => {
    const result = findNextWorkday(dayjs('2026-03-21 12:00:00'), defaultConfig)
    expect(result.format('YYYY-MM-DD')).toBe('2026-03-23')
  })
})

describe('时间目标计算引擎 - 节假日集成', () => {
  const configWithHolidays: EngineConfig = {
    workdays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    holidays: ['2026-03-18', '2026-03-19'] // 周三、周四为节假日
  }

  it('节假日当天视为非工作日', () => {
    // 周三 10:00，但当天是节假日
    const now = dayjs('2026-03-18 10:00:00').toDate()
    const result = calculateCountdown({ now, config: configWithHolidays })

    expect(result.eventType).toBe('restDay')
    expect(result.label).toBe('距离上班还有')
  })

  it('连续节假日：跳过到下一个工作日', () => {
    // 周三（节假日）10:00 → 目标 周五 09:00
    const now = dayjs('2026-03-18 10:00:00').toDate()
    const result = calculateCountdown({ now, config: configWithHolidays })

    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-03-20 09:00:00').toISOString()
    )
  })

  it('节假日前的下班后：跳过节假日到下一个工作日', () => {
    // 周二（03-17）下班后 → 周三是节假日、周四是节假日 → 目标周五 09:00
    const now = dayjs('2026-03-17 19:00:00').toDate()
    const result = calculateCountdown({ now, config: configWithHolidays })

    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-03-20 09:00:00').toISOString()
    )
  })

  it('春节假期：跳过多天假期', () => {
    const springFestivalConfig: EngineConfig = {
      workdays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      holidays: [
        '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
        '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23'
      ]
    }
    // 除夕前一天（02-15 周日）→ 目标 02-24（周二）09:00
    const now = dayjs('2026-02-15 14:00:00').toDate()
    const result = calculateCountdown({ now, config: springFestivalConfig })

    expect(result.targetTime.toISOString()).toBe(
      dayjs('2026-02-24 09:00:00').toISOString()
    )
  })

  it('节假日数据为空：不影响工作日判断', () => {
    const emptyHolidayConfig: EngineConfig = {
      ...defaultConfig,
      holidays: []
    }
    const now = dayjs('2026-03-18 14:00:00').toDate()
    const result = calculateCountdown({ now, config: emptyHolidayConfig })

    expect(result.eventType).toBe('working')
  })
})
