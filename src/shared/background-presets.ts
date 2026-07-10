// 预设背景画廊
// 每个预设定义了一组精心调配的 CSS 背景，部分附带动画叠层。
// 动画叠层的样式（keyframes + class）在 App.vue 的全局 <style> 中预定义，
// 通过 overlayClass 名称关联，避免动态注入 <style>。
import type { BackgroundConfig } from './types'

export interface BackgroundPreset {
  /** 唯一 id，用于持久化 */
  id: string
  /** 显示名称 */
  name: string
  /** 一句话描述，用于 tooltip */
  description: string
  /** 基底背景 CSS 值（可包含多层 gradient） */
  background: string
  /** 动画叠层 class（在 App.vue 中预定义），留空表示纯静态 */
  overlayClass?: string
  /**
   * 主题明暗：用于在浅色背景上自动切换字体默认色等。
   * 'dark'  = 背景偏暗，字体应为浅色
   * 'light' = 背景偏亮，字体应为深色
   * 'auto'  = 不做提示
   */
  tone: 'dark' | 'light' | 'auto'
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'aurora',
    name: '极光',
    description: '深夜星空下流动的极光',
    background: [
      'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(120, 220, 180, 0.35) 0%, transparent 55%)',
      'radial-gradient(ellipse 70% 50% at 80% 25%, rgba(140, 110, 220, 0.40) 0%, transparent 60%)',
      'radial-gradient(ellipse 90% 70% at 50% 110%, rgba(70, 150, 210, 0.30) 0%, transparent 60%)',
      'linear-gradient(165deg, #07101f 0%, #0e2138 45%, #081424 100%)'
    ].join(', '),
    overlayClass: 'overlay-aurora',
    tone: 'dark'
  },
  {
    id: 'sunset',
    name: '日落',
    description: '暖橘余晖与暮色紫调交织',
    background: [
      'radial-gradient(ellipse 90% 60% at 25% 85%, rgba(255, 190, 130, 0.55) 0%, transparent 55%)',
      'radial-gradient(ellipse 80% 50% at 75% 25%, rgba(255, 120, 150, 0.45) 0%, transparent 60%)',
      'linear-gradient(160deg, #2a1648 0%, #6a245c 38%, #c44569 72%, #f5a623 100%)'
    ].join(', '),
    tone: 'dark'
  },
  {
    id: 'abyss',
    name: '深海',
    description: '静谧深海中缓缓流动的光斑',
    background: [
      'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(90, 200, 230, 0.22) 0%, transparent 60%)',
      'radial-gradient(circle at 30% 60%, rgba(40, 120, 170, 0.18) 0%, transparent 45%)',
      'linear-gradient(180deg, #08192a 0%, #0a2640 45%, #04111e 100%)'
    ].join(', '),
    overlayClass: 'overlay-abyss',
    tone: 'dark'
  },
  {
    id: 'sakura',
    name: '樱花',
    description: '柔和粉色与初春微光',
    background: [
      'radial-gradient(circle at 22% 28%, rgba(255, 210, 225, 0.65) 0%, transparent 48%)',
      'radial-gradient(circle at 78% 72%, rgba(255, 185, 205, 0.55) 0%, transparent 52%)',
      'linear-gradient(155deg, #fff3f7 0%, #ffe2ec 50%, #fbd0e0 100%)'
    ].join(', '),
    tone: 'light'
  },
  {
    id: 'cosmos',
    name: '星河',
    description: '深紫宇宙中闪烁的星点',
    background: [
      'radial-gradient(ellipse 60% 50% at 30% 35%, rgba(130, 95, 220, 0.28) 0%, transparent 55%)',
      'radial-gradient(ellipse 70% 60% at 72% 65%, rgba(210, 105, 180, 0.22) 0%, transparent 60%)',
      'linear-gradient(180deg, #0c0820 0%, #1a1033 50%, #070414 100%)'
    ].join(', '),
    overlayClass: 'overlay-cosmos',
    tone: 'dark'
  },
  {
    id: 'mist',
    name: '薄荷',
    description: '清晨薄荷色雾气',
    background: [
      'radial-gradient(circle at 25% 25%, rgba(180, 245, 225, 0.55) 0%, transparent 50%)',
      'radial-gradient(circle at 75% 75%, rgba(165, 225, 235, 0.50) 0%, transparent 55%)',
      'linear-gradient(135deg, #e2f8ef 0%, #c8f3e6 50%, #b6ebe0 100%)'
    ].join(', '),
    tone: 'light'
  },
  {
    id: 'amber',
    name: '暖阳',
    description: '午后金色暖阳光晕',
    background: [
      'radial-gradient(circle at 30% 28%, rgba(255, 225, 150, 0.65) 0%, transparent 50%)',
      'radial-gradient(circle at 72% 72%, rgba(255, 180, 95, 0.45) 0%, transparent 55%)',
      'linear-gradient(135deg, #fff6e2 0%, #ffe1b0 50%, #ffce7a 100%)'
    ].join(', '),
    tone: 'light'
  },
  {
    id: 'ink',
    name: '墨韵',
    description: '中式水墨般的沉静深灰',
    background: [
      'radial-gradient(ellipse 60% 50% at 22% 32%, rgba(70, 80, 100, 0.55) 0%, transparent 55%)',
      'radial-gradient(ellipse 70% 60% at 78% 70%, rgba(45, 55, 75, 0.50) 0%, transparent 60%)',
      'linear-gradient(135deg, #1b1f27 0%, #2c313c 50%, #13161c 100%)'
    ].join(', '),
    tone: 'dark'
  }
]

/** 默认预设 id */
export const DEFAULT_PRESET_ID = 'aurora'

/** 根据 id 查找预设，找不到则回退到默认 */
export function findPreset(id: string): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((p) => p.id === id) ??
    BACKGROUND_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ??
    BACKGROUND_PRESETS[0]
  )
}

/** 旧版默认背景的签名（mode=color 且 color 为旧默认粉色） */
const LEGACY_DEFAULT_COLOR = '#ff7e8b'

/**
 * 规整背景配置：
 * 1. 旧版本配置缺少 presetId 字段 → 补齐为默认预设
 * 2. 旧版本停留在「旧默认粉色」上的用户 → 一次性升级为默认预设
 *    （仅迁移与旧默认完全一致的签名，用户自定义的颜色不受影响）
 * 3. preset 模式下 presetId 非法 → 回退到默认预设
 * 不修改传入对象，返回新对象。
 */
export function sanitizeBackground(bg: BackgroundConfig): BackgroundConfig {
  const next: BackgroundConfig = {
    ...bg,
    presetId: bg.presetId ?? DEFAULT_PRESET_ID
  }

  // 一次性迁移：旧默认粉色 → 默认预设
  if (
    next.mode === 'color' &&
    next.color.toLowerCase() === LEGACY_DEFAULT_COLOR &&
    !next.imagePath
  ) {
    next.mode = 'preset'
    next.presetId = DEFAULT_PRESET_ID
  }

  // preset 模式校验
  if (next.mode === 'preset' && !BACKGROUND_PRESETS.some((p) => p.id === next.presetId)) {
    next.presetId = DEFAULT_PRESET_ID
  }

  return next
}

