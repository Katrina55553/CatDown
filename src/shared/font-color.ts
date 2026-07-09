import type { FontColor, GradientColor, GradientStop } from './types'

/**
 * 将 FontColor 转换为 CSS color 属性值。
 * - solid: 返回颜色字符串本身
 * - gradient: 返回 gradient(...) 用于 background / -webkit-background-clip
 */
export function fontColorToCssColor(fc: FontColor): string {
  if (fc.type === 'solid') {
    return fc.color
  }
  return gradientToCss(fc)
}

/**
 * 将渐变配置转换为 CSS gradient 字符串
 * - linear: `linear-gradient(<angle>deg, <stop>..., <stop>...)`
 * - radial: `radial-gradient(circle, <stop>..., <stop>...)`
 */
export function gradientToCss(g: GradientColor): string {
  const stopsCss = sortStops(g.stops)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')

  if (g.gradientType === 'radial') {
    return `radial-gradient(circle, ${stopsCss})`
  }
  return `linear-gradient(${g.angle}deg, ${stopsCss})`
}

/**
 * 按 position 升序排序色标（不修改原数组）
 */
export function sortStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.position - b.position)
}

/**
 * 添加色标。新色标位置默认在末尾（最大 position + 一定步长，封顶 100）。
 * 返回新数组，不修改原数组。
 */
export function addStop(stops: GradientStop[], color = '#ffffff'): GradientStop[] {
  if (stops.length === 0) {
    return [
      { color, position: 0 },
      { color, position: 100 }
    ]
  }
  const sorted = sortStops(stops)
  const last = sorted[sorted.length - 1]
  const newPos = Math.min(100, last.position + 25)
  return [...stops, { color, position: newPos }]
}

/**
 * 删除指定索引的色标。保证至少保留 2 个色标。
 * 返回新数组，不修改原数组。如果尝试删除会导致少于 2 个，返回原数组。
 */
export function removeStop(stops: GradientStop[], index: number): GradientStop[] {
  if (index < 0 || index >= stops.length) return stops
  if (stops.length <= 2) return stops
  return stops.filter((_, i) => i !== index)
}

/**
 * 更新指定索引色标的颜色。
 */
export function updateStopColor(
  stops: GradientStop[],
  index: number,
  color: string
): GradientStop[] {
  if (index < 0 || index >= stops.length) return stops
  return stops.map((s, i) => (i === index ? { ...s, color } : s))
}

/**
 * 更新指定索引色标的位置，自动 clamp 到 [0, 100]。
 */
export function updateStopPosition(
  stops: GradientStop[],
  index: number,
  position: number
): GradientStop[] {
  if (index < 0 || index >= stops.length) return stops
  const clamped = Math.max(0, Math.min(100, position))
  return stops.map((s, i) => (i === index ? { ...s, position: clamped } : s))
}

/**
 * 校验 FontColor 配置是否合法。
 * - solid: color 非空字符串
 * - gradient: 至少 2 个 stops，每个 position ∈ [0,100]
 */
export function isValidFontColor(fc: FontColor): boolean {
  if (fc.type === 'solid') {
    return typeof fc.color === 'string' && fc.color.length > 0
  }
  if (!Array.isArray(fc.stops) || fc.stops.length < 2) return false
  if (fc.gradientType !== 'linear' && fc.gradientType !== 'radial') return false
  if (typeof fc.angle !== 'number' || fc.angle < 0 || fc.angle > 360) return false
  return fc.stops.every(
    (s) =>
      typeof s.color === 'string' &&
      s.color.length > 0 &&
      typeof s.position === 'number' &&
      s.position >= 0 &&
      s.position <= 100
  )
}

/**
 * 修正 FontColor 配置：如果非法则回退到默认（不修改原对象）。
 */
export function sanitizeFontColor(fc: FontColor, fallback: FontColor): FontColor {
  if (isValidFontColor(fc)) return fc
  return fallback
}
