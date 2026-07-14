import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { readJson, writeJson, getUserDataPath, getUserDataDir, setUserDataResolver } from './json-store'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'catdown-json-'))
  setUserDataResolver(() => tmpDir)
})

afterEach(() => {
  setUserDataResolver(null)
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('json-store - 路径解析', () => {
  it('getUserDataDir 返回注入的目录', () => {
    expect(getUserDataDir()).toBe(tmpDir)
  })

  it('getUserDataPath 拼接文件名', () => {
    expect(getUserDataPath('config.json')).toBe(join(tmpDir, 'config.json'))
  })
})

describe('json-store - readJson', () => {
  it('文件不存在：写入默认值并返回其拷贝', () => {
    const defaultValue = { name: 'default', n: 1 }
    const result = readJson({ filename: 'a.json', defaultValue })
    expect(result).toEqual(defaultValue)
    // 文件应已写入
    const raw = readFileSync(join(tmpDir, 'a.json'), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultValue)
  })

  it('返回的默认值是拷贝，修改不影响原对象', () => {
    const defaultValue = { items: [1, 2] }
    const result = readJson({ filename: 'b.json', defaultValue })
    // 浅拷贝：顶层是不同对象
    expect(result).not.toBe(defaultValue)
    expect(result).toEqual(defaultValue)
  })

  it('JSON 解析失败：回退默认值并重写文件', () => {
    writeFileSync(join(tmpDir, 'c.json'), '{invalid json', 'utf-8')
    const defaultValue = { ok: true }
    const result = readJson({ filename: 'c.json', defaultValue })
    expect(result).toEqual(defaultValue)
    // 文件应被重写为默认值
    const raw = readFileSync(join(tmpDir, 'c.json'), 'utf-8')
    expect(JSON.parse(raw)).toEqual(defaultValue)
  })

  it('validate 返回 false：回退默认值并重写文件', () => {
    writeFileSync(join(tmpDir, 'd.json'), JSON.stringify({ wrong: true }), 'utf-8')
    const result = readJson({
      filename: 'd.json',
      defaultValue: { right: true },
      validate: (v) => typeof v === 'object' && v !== null && 'right' in v
    })
    expect(result).toEqual({ right: true })
    const raw = readFileSync(join(tmpDir, 'd.json'), 'utf-8')
    expect(JSON.parse(raw)).toEqual({ right: true })
  })

  it('正常解析：返回 sanitize 后的结果', () => {
    writeFileSync(join(tmpDir, 'e.json'), JSON.stringify({ raw: 1 }), 'utf-8')
    const result = readJson({
      filename: 'e.json',
      defaultValue: { raw: 0, extra: 'default' },
      sanitize: (v) => ({ ...(v as object), extra: 'sanitized' }) as { raw: number; extra: string }
    })
    expect(result).toEqual({ raw: 1, extra: 'sanitized' })
  })

  it('正常解析无 sanitize：原样返回', () => {
    const data = { a: 1, b: 'two' }
    writeFileSync(join(tmpDir, 'f.json'), JSON.stringify(data), 'utf-8')
    const result = readJson<{ a: number; b: string }>({ filename: 'f.json', defaultValue: { a: 0, b: '' } })
    expect(result).toEqual(data)
  })

  it('validate 通过但不提供 sanitize：原样返回解析值', () => {
    writeFileSync(join(tmpDir, 'g.json'), JSON.stringify({ x: 10 }), 'utf-8')
    const result = readJson({
      filename: 'g.json',
      defaultValue: { x: 0 },
      validate: (v) => typeof v === 'object' && v !== null && 'x' in v
    })
    expect(result).toEqual({ x: 10 })
  })
})

describe('json-store - writeJson', () => {
  it('写入文件并返回正确内容', () => {
    const data = { hello: 'world' }
    writeJson('out.json', data)
    const raw = readFileSync(join(tmpDir, 'out.json'), 'utf-8')
    expect(JSON.parse(raw)).toEqual(data)
  })

  it('写入时自动确保目录存在', () => {
    // 指向一个尚不存在的子目录路径：通过新 resolver 注入
    const nestedDir = join(tmpDir, 'nested', 'deep')
    setUserDataResolver(() => nestedDir)
    writeJson('nested.json', { ok: true })
    expect(existsSync(join(nestedDir, 'nested.json'))).toBe(true)
  })
})
