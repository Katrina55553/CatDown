import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { setUserDataResolver } from './json-store'
import { saveCroppedImage, readImageAsDataURL } from './background'

// 1x1 透明 PNG 的 base64
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'catdown-bg-'))
  setUserDataResolver(() => tmpDir)
})

afterEach(() => {
  setUserDataResolver(null)
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('background - saveCroppedImage', () => {
  it('保存纯 base64 并返回文件名', () => {
    const filename = saveCroppedImage(PNG_BASE64, 'png')
    expect(filename).toBe('background.png')
    expect(existsSync(join(tmpDir, 'bg', 'background.png'))).toBe(true)
  })

  it('保存 data URL 前缀的 base64', () => {
    const dataUrl = `data:image/png;base64,${PNG_BASE64}`
    const filename = saveCroppedImage(dataUrl, 'png')
    expect(filename).toBe('background.png')
    expect(existsSync(join(tmpDir, 'bg', 'background.png'))).toBe(true)
  })

  it('默认扩展名为 png', () => {
    const filename = saveCroppedImage(PNG_BASE64)
    expect(filename).toBe('background.png')
  })

  it('自动创建 bg 目录', () => {
    // tmpDir/bg 不存在时能正常保存
    expect(existsSync(join(tmpDir, 'bg'))).toBe(false)
    saveCroppedImage(PNG_BASE64, 'png')
    expect(existsSync(join(tmpDir, 'bg'))).toBe(true)
  })
})

describe('background - readImageAsDataURL', () => {
  it('空路径返回 null', () => {
    expect(readImageAsDataURL('')).toBeNull()
  })

  it('文件不存在返回 null', () => {
    expect(readImageAsDataURL('background.png')).toBeNull()
  })

  it('读取已保存的图片返回 data URL', () => {
    saveCroppedImage(PNG_BASE64, 'png')
    const dataUrl = readImageAsDataURL('background.png')
    expect(dataUrl).not.toBeNull()
    expect(dataUrl).toBe(`data:image/png;base64,${PNG_BASE64}`)
  })

  it('jpeg 扩展名映射为 image/jpeg mime', () => {
    // 保存为 jpg 扩展名，读取时 mime 应为 image/jpeg
    saveCroppedImage(PNG_BASE64, 'jpg')
    const dataUrl = readImageAsDataURL('background.jpg')
    expect(dataUrl).not.toBeNull()
    expect(dataUrl).toBe(`data:image/jpeg;base64,${PNG_BASE64}`)
  })
})
