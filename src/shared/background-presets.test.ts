import { describe, it, expect } from 'vitest'
import {
  BACKGROUND_PRESETS,
  DEFAULT_PRESET_ID,
  findPreset,
  sanitizeBackground
} from './background-presets'
import { defaultBackground } from './types'
import type { BackgroundConfig } from './types'

describe('BACKGROUND_PRESETS', () => {
  it('每个预设 id 唯一', () => {
    const ids = BACKGROUND_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每个预设都有非空 background 与 name', () => {
    for (const p of BACKGROUND_PRESETS) {
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.background.length).toBeGreaterThan(0)
    }
  })

  it('默认预设 id 存在于列表中', () => {
    expect(BACKGROUND_PRESETS.some((p) => p.id === DEFAULT_PRESET_ID)).toBe(true)
  })
})

describe('findPreset', () => {
  it('已知 id 返回对应预设', () => {
    expect(findPreset('aurora').id).toBe('aurora')
    expect(findPreset('sakura').id).toBe('sakura')
  })

  it('未知 id 回退到默认预设', () => {
    expect(findPreset('not-exist').id).toBe(DEFAULT_PRESET_ID)
  })

  it('空字符串回退到默认预设', () => {
    expect(findPreset('').id).toBe(DEFAULT_PRESET_ID)
  })
})

describe('sanitizeBackground', () => {
  it('合法 preset 配置原样保留（引用不同，值相同）', () => {
    const bg: BackgroundConfig = {
      mode: 'preset',
      presetId: 'cosmos',
      color: '#ff7e8b',
      imagePath: '',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result).toEqual(bg)
    expect(result).not.toBe(bg) // 返回新对象
  })

  it('缺 presetId 字段时补齐为默认预设', () => {
    const bg = {
      mode: 'preset',
      color: '#ff7e8b',
      imagePath: '',
      cropRatio: '16:9'
    } as BackgroundConfig
    const result = sanitizeBackground(bg)
    expect(result.presetId).toBe(DEFAULT_PRESET_ID)
  })

  it('旧默认粉色一次性迁移为默认预设', () => {
    const bg: BackgroundConfig = {
      mode: 'color',
      presetId: '',
      color: '#ff7e8b',
      imagePath: '',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result.mode).toBe('preset')
    expect(result.presetId).toBe(DEFAULT_PRESET_ID)
  })

  it('大写旧默认粉色也会迁移', () => {
    const bg: BackgroundConfig = {
      mode: 'color',
      presetId: '',
      color: '#FF7E8B',
      imagePath: '',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result.mode).toBe('preset')
  })

  it('用户自定义颜色不受迁移影响', () => {
    const bg: BackgroundConfig = {
      mode: 'color',
      presetId: '',
      color: '#123456',
      imagePath: '',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result.mode).toBe('color')
    expect(result.color).toBe('#123456')
  })

  it('图片模式不受迁移影响', () => {
    const bg: BackgroundConfig = {
      mode: 'image',
      presetId: '',
      color: '#ff7e8b',
      imagePath: 'bg/background.png',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result.mode).toBe('image')
    expect(result.imagePath).toBe('bg/background.png')
  })

  it('preset 模式下非法 presetId 回退到默认预设', () => {
    const bg: BackgroundConfig = {
      mode: 'preset',
      presetId: 'ghost',
      color: '#ff7e8b',
      imagePath: '',
      cropRatio: '16:9'
    }
    const result = sanitizeBackground(bg)
    expect(result.presetId).toBe(DEFAULT_PRESET_ID)
  })

  it('默认背景配置通过 sanitize 后保持预设模式', () => {
    const result = sanitizeBackground(defaultBackground)
    expect(result.mode).toBe('preset')
    expect(result.presetId).toBe(DEFAULT_PRESET_ID)
  })
})
