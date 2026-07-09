import { describe, it, expect } from 'vitest'
import {
  fontColorToCssColor,
  gradientToCss,
  sortStops,
  addStop,
  removeStop,
  updateStopColor,
  updateStopPosition,
  isValidFontColor,
  sanitizeFontColor
} from './font-color'
import type { FontColor, GradientColor, GradientStop } from './types'
import { defaultFontColor, defaultGradient } from './types'

describe('fontColorToCssColor', () => {
  it('纯色：直接返回 color 字符串', () => {
    const fc: FontColor = { type: 'solid', color: '#ff0000' }
    expect(fontColorToCssColor(fc)).toBe('#ff0000')
  })

  it('渐变：返回 linear-gradient(...) 字符串', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 }
      ]
    }
    expect(fontColorToCssColor(fc)).toBe('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)')
  })

  it('渐变：返回 radial-gradient(...) 字符串', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'radial',
      angle: 0,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 }
      ]
    }
    expect(fontColorToCssColor(fc)).toBe('radial-gradient(circle, #ff0000 0%, #0000ff 100%)')
  })
})

describe('gradientToCss', () => {
  it('色标按 position 升序输出', () => {
    const g: GradientColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 0,
      stops: [
        { color: '#0000ff', position: 100 },
        { color: '#00ff00', position: 50 },
        { color: '#ff0000', position: 0 }
      ]
    }
    expect(gradientToCss(g)).toBe(
      'linear-gradient(0deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)'
    )
  })

  it('radial 类型忽略 angle', () => {
    const g: GradientColor = {
      type: 'gradient',
      gradientType: 'radial',
      angle: 999,
      stops: [
        { color: '#a', position: 0 },
        { color: '#b', position: 100 }
      ]
    }
    expect(gradientToCss(g)).toBe('radial-gradient(circle, #a 0%, #b 100%)')
  })
})

describe('sortStops', () => {
  it('返回新数组（不修改原数组）', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 50 },
      { color: '#b', position: 0 }
    ]
    const sorted = sortStops(stops)
    expect(sorted).not.toBe(stops)
    expect(sorted[0].position).toBe(0)
    expect(stops[0].position).toBe(50) // 原数组未变
  })

  it('空数组返回空数组', () => {
    expect(sortStops([])).toEqual([])
  })
})

describe('addStop', () => {
  it('空数组：创建两个色标（0% 和 100%）', () => {
    const result = addStop([])
    expect(result).toHaveLength(2)
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(100)
  })

  it('非空数组：在末尾追加色标，position = max+25 封顶 100', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 50 }
    ]
    const result = addStop(stops, '#c')
    expect(result).toHaveLength(3)
    expect(result[2].color).toBe('#c')
    expect(result[2].position).toBe(75) // 50 + 25
  })

  it('position 已达 100：封顶为 100', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 100 }
    ]
    const result = addStop(stops)
    expect(result[2].position).toBe(100)
  })

  it('不修改原数组', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 100 }
    ]
    addStop(stops)
    expect(stops).toHaveLength(2)
  })
})

describe('removeStop', () => {
  it('正常删除中间色标', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 50 },
      { color: '#c', position: 100 }
    ]
    const result = removeStop(stops, 1)
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.color)).toEqual(['#a', '#c'])
  })

  it('只剩 2 个时拒绝删除，返回原数组', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 100 }
    ]
    const result = removeStop(stops, 0)
    expect(result).toBe(stops)
    expect(result).toHaveLength(2)
  })

  it('越界索引返回原数组', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 100 }
    ]
    expect(removeStop(stops, -1)).toBe(stops)
    expect(removeStop(stops, 99)).toBe(stops)
  })
})

describe('updateStopColor', () => {
  it('更新指定索引的颜色', () => {
    const stops: GradientStop[] = [
      { color: '#a', position: 0 },
      { color: '#b', position: 100 }
    ]
    const result = updateStopColor(stops, 1, '#new')
    expect(result[1].color).toBe('#new')
    expect(result[0].color).toBe('#a')
  })

  it('越界索引返回原数组', () => {
    const stops: GradientStop[] = [{ color: '#a', position: 0 }]
    expect(updateStopColor(stops, 5, '#x')).toBe(stops)
  })
})

describe('updateStopPosition', () => {
  it('更新位置并 clamp 到 [0, 100]', () => {
    const stops: GradientStop[] = [{ color: '#a', position: 50 }]
    expect(updateStopPosition(stops, 0, 200)[0].position).toBe(100)
    expect(updateStopPosition(stops, 0, -10)[0].position).toBe(0)
    expect(updateStopPosition(stops, 0, 30)[0].position).toBe(30)
  })

  it('越界索引返回原数组', () => {
    const stops: GradientStop[] = [{ color: '#a', position: 0 }]
    expect(updateStopPosition(stops, -1, 50)).toBe(stops)
  })
})

describe('isValidFontColor', () => {
  it('合法的 solid 配置', () => {
    expect(isValidFontColor({ type: 'solid', color: '#fff' })).toBe(true)
  })

  it('solid 的 color 为空字符串：非法', () => {
    expect(isValidFontColor({ type: 'solid', color: '' })).toBe(false)
  })

  it('合法的 gradient 配置', () => {
    expect(isValidFontColor(defaultGradient)).toBe(true)
  })

  it('gradient 少于 2 个 stops：非法', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 90,
      stops: [{ color: '#a', position: 0 }]
    }
    expect(isValidFontColor(fc)).toBe(false)
  })

  it('gradient 的 angle 越界：非法', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 500,
      stops: [
        { color: '#a', position: 0 },
        { color: '#b', position: 100 }
      ]
    }
    expect(isValidFontColor(fc)).toBe(false)
  })

  it('gradient 的 gradientType 非法：非法', () => {
    const fc = {
      type: 'gradient',
      gradientType: 'xxx',
      angle: 0,
      stops: [
        { color: '#a', position: 0 },
        { color: '#b', position: 100 }
      ]
    } as unknown as FontColor
    expect(isValidFontColor(fc)).toBe(false)
  })

  it('gradient 的 stop position 越界：非法', () => {
    const fc: FontColor = {
      type: 'gradient',
      gradientType: 'linear',
      angle: 0,
      stops: [
        { color: '#a', position: -1 },
        { color: '#b', position: 100 }
      ]
    }
    expect(isValidFontColor(fc)).toBe(false)
  })
})

describe('sanitizeFontColor', () => {
  it('合法配置：原样返回', () => {
    const fc: FontColor = { type: 'solid', color: '#abc' }
    expect(sanitizeFontColor(fc, defaultFontColor)).toBe(fc)
  })

  it('非法配置：返回 fallback', () => {
    const fc = { type: 'solid', color: '' } as unknown as FontColor
    expect(sanitizeFontColor(fc, defaultFontColor)).toBe(defaultFontColor)
  })
})
