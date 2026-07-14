import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  computeDashboard,
  formatDisplayText,
  buildFontColorStyle,
  buildBackgroundStyle
} from './dashboard'
import { defaultConfig, defaultFontColor } from '@shared/types'
import type { AppConfig, CountdownResult, FontColor, BackgroundConfig, SolidColor } from '@shared/types'

// 默认配置：周一到周五 09:00-18:00
const baseConfig: AppConfig = { ...defaultConfig }

function makeInput(overrides: Partial<Parameters<typeof computeDashboard>[0]> = {}) {
  return {
    config: baseConfig,
    holidays: [],
    holidayEntries: [],
    backgroundUrl: '',
    now: dayjs('2026-03-18 14:30:00').toDate(), // 2026-03-18 是周三
    ...overrides
  }
}

describe('formatDisplayText', () => {
  const base: CountdownResult = {
    eventType: 'working',
    targetTime: new Date(),
    remainingMs: 0,
    days: 0,
    hours: 1,
    minutes: 30,
    seconds: 0,
    label: '下班还有'
  }

  it('工作中场景：显示 HH:MM:SS', () => {
    expect(formatDisplayText({ ...base, eventType: 'working' })).toBe('下班还有 01:30:00')
  })

  it('上班前跨天场景：显示 X天 Y小时', () => {
    expect(formatDisplayText({ ...base, eventType: 'afterWork', days: 2, hours: 14, label: '距离上班还有' })).toBe(
      '距离上班还有 2天 14小时'
    )
  })

  it('上班前不跨天场景：显示 HH:MM:SS', () => {
    expect(formatDisplayText({ ...base, eventType: 'beforeWork', days: 0, hours: 1, minutes: 0, seconds: 0, label: '距离上班还有' })).toBe(
      '距离上班还有 01:00:00'
    )
  })

  it('noWorkday 场景：只显示 label', () => {
    expect(formatDisplayText({ ...base, eventType: 'noWorkday', label: '请先设置工作日' })).toBe('请先设置工作日')
  })
})

describe('buildFontColorStyle', () => {
  it('纯色：返回 color 属性', () => {
    const style = buildFontColorStyle({ type: 'solid', color: '#ff0000' })
    expect(style).toEqual({ color: '#ff0000' })
  })

  it('渐变：使用 background-clip:text', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 }
      ]
    }
    const style = buildFontColorStyle(fc)
    expect(style.backgroundImage).toBe('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)')
    expect(style.WebkitBackgroundClip).toBe('text')
    expect(style.backgroundClip).toBe('text')
    expect(style.WebkitTextFillColor).toBe('transparent')
    expect(style.color).toBe('transparent')
  })

  it('非法字体颜色：回退到默认', () => {
    // stops 少于 2 个，非法
    const invalid = { type: 'gradient', gradientType: 'linear', angle: 90, stops: [{ color: '#fff', position: 0 }] } as unknown as FontColor
    const style = buildFontColorStyle(invalid)
    expect(style).toEqual({ color: (defaultFontColor as SolidColor).color })
  })
})

describe('buildBackgroundStyle', () => {
  it('image 模式且有 url：使用背景图', () => {
    const bg: BackgroundConfig = { ...baseConfig.background, mode: 'image', imagePath: 'background.png' }
    const { backgroundStyle, overlayClass, activePreset, isPreset } = buildBackgroundStyle(bg, 'data:image/png;base64,xxx')
    expect(backgroundStyle.backgroundImage).toBe('url(data:image/png;base64,xxx)')
    expect(backgroundStyle.backgroundSize).toBe('cover')
    expect(isPreset).toBe(false)
    expect(activePreset).toBeNull()
    expect(overlayClass).toBe('')
  })

  it('image 模式但无 url：回退到 color', () => {
    const bg: BackgroundConfig = { ...baseConfig.background, mode: 'image', color: '#abcdef', imagePath: '' }
    const { backgroundStyle, isPreset } = buildBackgroundStyle(bg, '')
    expect(backgroundStyle.background).toBe('#abcdef')
    expect(isPreset).toBe(false)
  })

  it('preset 模式且预设存在：使用预设背景', () => {
    const bg: BackgroundConfig = { ...baseConfig.background, mode: 'preset', presetId: 'aurora' }
    const { backgroundStyle, activePreset, isPreset, overlayClass } = buildBackgroundStyle(bg, '')
    expect(isPreset).toBe(true)
    expect(activePreset).not.toBeNull()
    expect(activePreset?.id).toBe('aurora')
    expect(backgroundStyle.background).toBe(activePreset?.background)
    // aurora 预设应有动画叠层
    expect(overlayClass).toBe('overlay-aurora')
  })

  it('preset 模式但预设不存在：回退到默认预设（非 color 模式）', () => {
    const bg: BackgroundConfig = { ...baseConfig.background, mode: 'preset', presetId: 'not-exist', color: '#123456' }
    const { backgroundStyle, activePreset, isPreset } = buildBackgroundStyle(bg, '')
    // findPreset 对非法 id 回退到默认预设（aurora），不会降到 color 模式
    expect(isPreset).toBe(true)
    expect(activePreset).not.toBeNull()
    expect(activePreset?.id).toBe('aurora')
    expect(backgroundStyle.background).toBe(activePreset?.background)
  })

  it('color 模式：使用纯色', () => {
    const bg: BackgroundConfig = { ...baseConfig.background, mode: 'color', color: '#ff7e8b' }
    const { backgroundStyle, isPreset } = buildBackgroundStyle(bg, '')
    expect(backgroundStyle.background).toBe('#ff7e8b')
    expect(isPreset).toBe(false)
  })
})

describe('computeDashboard - 端到端', () => {
  it('工作日上班中：eventType 为 working', () => {
    const state = computeDashboard(makeInput({ now: dayjs('2026-03-18 14:30:00').toDate() }))
    expect(state.countdown.eventType).toBe('working')
    expect(state.countdown.label).toBe('下班还有')
    expect(state.displayText).toBe('下班还有 03:30:00')
  })

  it('工作日上班前：eventType 为 beforeWork', () => {
    const state = computeDashboard(makeInput({ now: dayjs('2026-03-18 08:00:00').toDate() }))
    expect(state.countdown.eventType).toBe('beforeWork')
    expect(state.displayText).toBe('距离上班还有 01:00:00')
  })

  it('工作日下班后：不跨天时显示 HH:MM:SS', () => {
    // 周三 19:00 → 周四 09:00 = 14小时，days=0（不足1天），显示 HH:MM:SS
    const state = computeDashboard(makeInput({ now: dayjs('2026-03-18 19:00:00').toDate() }))
    expect(state.countdown.eventType).toBe('afterWork')
    expect(state.displayText).toBe('距离上班还有 14:00:00')
  })

  it('周五下班后：跳到下周一，跨天显示', () => {
    // 2026-03-20 是周五，19:00 → 下周一 09:00 = 2天 14小时
    const state = computeDashboard(makeInput({ now: dayjs('2026-03-20 19:00:00').toDate() }))
    expect(state.countdown.eventType).toBe('afterWork')
    expect(state.displayText).toBe('距离上班还有 2天 14小时')
  })

  it('周末（非工作日）：eventType 为 restDay', () => {
    // 2026-03-21 是周六
    const state = computeDashboard(makeInput({ now: dayjs('2026-03-21 12:00:00').toDate() }))
    expect(state.countdown.eventType).toBe('restDay')
  })

  it('未设置任何工作日：eventType 为 noWorkday，displayText 为 label', () => {
    const state = computeDashboard(makeInput({ config: { ...baseConfig, workdays: [] } }))
    expect(state.countdown.eventType).toBe('noWorkday')
    expect(state.displayText).toBe(state.countdown.label)
  })

  it('节假日：视为非工作日', () => {
    // 2026-03-18 周三设为节假日
    const state = computeDashboard(
      makeInput({
        now: dayjs('2026-03-18 14:30:00').toDate(),
        holidays: ['2026-03-18'],
        holidayEntries: [{ date: '2026-03-18', name: '测试假' }]
      })
    )
    expect(state.countdown.eventType).toBe('restDay')
  })

  it('收入卡片：未设置月薪时 shouldShow 为 false', () => {
    const state = computeDashboard(makeInput({ config: { ...baseConfig, monthlySalary: 0 } }))
    expect(state.income.shouldShow).toBe(false)
  })

  it('收入卡片：设置月薪后 shouldShow 为 true 且 formatted 含 ¥', () => {
    const state = computeDashboard(
      makeInput({
        now: dayjs('2026-03-18 14:30:00').toDate(),
        config: { ...baseConfig, monthlySalary: 20000 }
      })
    )
    expect(state.income.shouldShow).toBe(true)
    expect(state.income.formatted).toContain('¥')
  })

  it('下一个节日：能找到今日及之后的节日', () => {
    const state = computeDashboard(
      makeInput({
        now: dayjs('2026-03-18 14:30:00').toDate(),
        holidayEntries: [{ date: '2026-04-05', name: '清明节' }]
      })
    )
    expect(state.nextHoliday.found).toBe(true)
    expect(state.nextHoliday.name).toBe('清明节')
  })

  it('isPreset 与默认配置（preset 模式）一致', () => {
    const state = computeDashboard(makeInput())
    // 默认配置 background.mode = 'preset', presetId = 'aurora'
    expect(state.isPreset).toBe(true)
    expect(state.activePreset?.id).toBe('aurora')
  })
})
