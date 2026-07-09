// 用户配置类型定义
export interface AppConfig {
  // 组件名称
  widgetName: string
  // 工作日（0=周日, 1=周一, ..., 6=周六）
  workdays: number[]
  // 上班时间 HH:MM
  startTime: string
  // 下班时间 HH:MM
  endTime: string
  // 月薪（元），0 表示未设置
  monthlySalary: number
  // 发薪日（每月几号，1-31）
  payday: number
  // 遇节假日是否提前发
  paydayAdvanceOnHoliday: boolean
  // 显示开关
  showPayday: boolean
  showFriday: boolean
  showHoliday: boolean
  showIncome: boolean
  // 收入小数位数
  incomeDecimals: number
  // 猫咪插画
  showCat: boolean
  // 极简模式
  minimalMode: boolean
  // 开机自启
  autoStart: boolean
}

export const defaultConfig: AppConfig = {
  widgetName: '下班倒计时',
  workdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  monthlySalary: 0,
  payday: 10,
  paydayAdvanceOnHoliday: true,
  showPayday: true,
  showFriday: true,
  showHoliday: true,
  showIncome: true,
  incomeDecimals: 2,
  showCat: true,
  minimalMode: false,
  autoStart: false
}

// 时间目标事件类型
export type TargetEventType = 'beforeWork' | 'working' | 'afterWork' | 'restDay' | 'noWorkday'

// 时间引擎输出
export interface CountdownResult {
  eventType: TargetEventType
  targetTime: Date
  remainingMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  label: string
}

// 节假日条目
export interface HolidayEntry {
  date: string // "YYYY-MM-DD"
  name: string
}

// 收入计算结果（从 income.ts 重新导出）
export type { IncomeResult } from './income'

// 发薪日计算结果（从 payday.ts 重新导出）
export type { PaydayResult } from './payday'

// 辅助卡片计算结果（从 auxiliary.ts 重新导出）
export type { FridayResult, NextHolidayResult } from './auxiliary'

// IPC 通道名称
export const IPC_CHANNELS = {
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',
  SHOW_MAIN_WINDOW: 'window:show',
  QUIT_APP: 'app:quit',
  GET_HOLIDAYS: 'holidays:get',
  ADD_HOLIDAY: 'holidays:add',
  REMOVE_HOLIDAY: 'holidays:remove',
  RESET_HOLIDAYS: 'holidays:reset'
} as const
