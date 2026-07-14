import type { CSSProperties } from 'vue'
import { calculateCountdown, buildEngineConfig } from '@shared/engine'
import { calculateTodayIncome } from '@shared/income'
import { calculatePayday } from '@shared/payday'
import { calculateFriday, findNextHoliday } from '@shared/auxiliary'
import { fontColorToCssColor, sanitizeFontColor } from '@shared/font-color'
import { findPreset, type BackgroundPreset } from '@shared/background-presets'
import { defaultFontColor } from '@shared/types'
import type {
  AppConfig,
  HolidayEntry,
  CountdownResult,
  IncomeResult,
  PaydayResult,
  FridayResult,
  NextHolidayResult
} from '@shared/types'

/**
 * Dashboard view-model 输入：仅依赖配置、节假日与当前时间。
 * 不包含任何渲染进程副作用，便于单元测试。
 */
export interface DashboardInput {
  config: AppConfig
  /** 节假日日期列表（影响引擎计算） */
  holidays: string[]
  /** 节假日条目（含名称，用于「下一个节日」卡片） */
  holidayEntries: HolidayEntry[]
  /** 当前背景图 data URL（图片模式时使用） */
  backgroundUrl: string
  now: Date
}

/**
 * Dashboard 计算后的展示态：所有卡片数据与样式均在此就绪。
 */
export interface DashboardState {
  countdown: CountdownResult
  income: IncomeResult
  payday: PaydayResult
  friday: FridayResult
  nextHoliday: NextHolidayResult
  /** 主倒计时展示文案 */
  displayText: string
  /** 主倒计时字体颜色样式（纯色或渐变 background-clip:text） */
  fontColorStyle: CSSProperties
  /** 预览区背景样式 */
  backgroundStyle: CSSProperties
  /** 预设背景动画叠层 class（无则为空字符串） */
  overlayClass: string
  /** 当前预设（preset 模式时返回，其它模式为 null） */
  activePreset: BackgroundPreset | null
  /** 是否为预设背景模式（用于预览区 is-preset class） */
  isPreset: boolean
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 由配置与当前时间计算 dashboard 展示态。纯函数，无副作用。
 */
export function computeDashboard(input: DashboardInput): DashboardState {
  const { config, holidays, holidayEntries, backgroundUrl, now } = input
  const engineConfig = buildEngineConfig(config, holidays)

  const countdown = calculateCountdown({ now, config: engineConfig })
  const income = calculateTodayIncome({
    now,
    monthlySalary: config.monthlySalary,
    dailySalary: config.dailySalary,
    salaryType: config.salaryType,
    config: engineConfig,
    decimals: config.incomeDecimals
  })
  const payday = calculatePayday({
    now,
    payday: config.payday,
    advanceOnHoliday: config.paydayAdvanceOnHoliday,
    config: engineConfig
  })
  const friday = calculateFriday(now, engineConfig)
  const nextHoliday = findNextHoliday(now, holidayEntries)

  const displayText = formatDisplayText(countdown)
  const fontColorStyle = buildFontColorStyle(config.fontColor)
  const { backgroundStyle, overlayClass, activePreset, isPreset } = buildBackgroundStyle(
    config.background,
    backgroundUrl
  )

  return {
    countdown,
    income,
    payday,
    friday,
    nextHoliday,
    displayText,
    fontColorStyle,
    backgroundStyle,
    overlayClass,
    activePreset,
    isPreset
  }
}

/** 主倒计时文案：跨天显示「X天 Y小时」，否则 HH:MM:SS */
export function formatDisplayText(countdown: CountdownResult): string {
  if (countdown.eventType === 'noWorkday') return countdown.label
  if (countdown.eventType !== 'working' && countdown.days >= 1) {
    return `${countdown.label} ${countdown.days}天 ${countdown.hours}小时`
  }
  return `${countdown.label} ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
}

/** 字体颜色样式：纯色用 color，渐变用 background-clip:text */
export function buildFontColorStyle(fontColor: AppConfig['fontColor']): CSSProperties {
  const safe = sanitizeFontColor(fontColor, defaultFontColor)
  if (safe.type === 'solid') {
    return { color: safe.color }
  }
  return {
    backgroundImage: fontColorToCssColor(safe),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent'
  }
}

/** 预览区背景样式与预设信息 */
export function buildBackgroundStyle(
  background: AppConfig['background'],
  backgroundUrl: string
): {
  backgroundStyle: CSSProperties
  overlayClass: string
  activePreset: BackgroundPreset | null
  isPreset: boolean
} {
  const activePreset = background.mode === 'preset' ? findPreset(background.presetId) : null
  const isPreset = activePreset !== null

  let backgroundStyle: CSSProperties
  if (background.mode === 'image' && backgroundUrl) {
    backgroundStyle = {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else if (background.mode === 'preset' && activePreset) {
    backgroundStyle = { background: activePreset.background }
  } else {
    backgroundStyle = { background: background.color }
  }

  return {
    backgroundStyle,
    overlayClass: activePreset?.overlayClass ?? '',
    activePreset,
    isPreset
  }
}
