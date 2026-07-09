import { app, dialog } from 'electron'
import { join, extname } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'fs'

/** 图片最大 5MB */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/** 支持的图片扩展名 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/** 背景图存储目录（userData/bg/） */
function getBgDir(): string {
  return join(app.getPath('userData'), 'bg')
}

/** 确保背景目录存在 */
function ensureBgDir(): void {
  const dir = getBgDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export interface SelectImageResult {
  /** 用户选择的文件绝对路径 */
  path: string
  /** 文件大小（字节） */
  size: number
  /** 原图 base64 data URL（供渲染进程加载到 cropper） */
  dataUrl: string
  /** 扩展名（不含点），例如 'png' */
  ext: string
}

/**
 * 打开文件选择对话框，让用户选择图片。
 * 校验扩展名和大小（≤5MB）。
 * 返回 null 表示用户取消。
 */
export async function selectImageFile(): Promise<SelectImageResult | null> {
  const result = await dialog.showOpenDialog({
    title: '选择背景图片',
    properties: ['openFile'],
    filters: [
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  const ext = extname(filePath).toLowerCase()
  const extNoDot = ext.slice(1)

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`不支持的图片格式: ${ext}，仅支持 JPG/PNG/WebP`)
  }

  const stat = statSync(filePath)
  if (stat.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `图片大小 ${(stat.size / 1024 / 1024).toFixed(2)}MB 超过 5MB 限制`
    )
  }

  const buffer = readFileSync(filePath)
  const mime = extNoDot === 'jpg' ? 'jpeg' : extNoDot
  const dataUrl = `data:image/${mime};base64,${buffer.toString('base64')}`

  return { path: filePath, size: stat.size, dataUrl, ext: extNoDot }
}

/**
 * 把 base64 编码的裁剪后图片保存到 userData/bg/background.<ext>
 * 返回相对路径（用于配置存储），例如 'background.png'
 */
export function saveCroppedImage(base64Data: string, ext = 'png'): string {
  ensureBgDir()
  const filename = `background.${ext}`
  const filePath = join(getBgDir(), filename)

  // 去掉 data URL 前缀：data:image/png;base64,xxxx
  const base64 = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data

  const buffer = Buffer.from(base64, 'base64')
  writeFileSync(filePath, buffer)

  return filename
}

/**
 * 读取背景图文件，返回 data URL（可直接用于 <img src> 或 background-image）。
 * 如果文件不存在返回 null。
 */
export function readImageAsDataURL(relPath: string): string | null {
  if (!relPath) return null
  const filePath = join(getBgDir(), relPath)
  if (!existsSync(filePath)) return null

  const buffer = readFileSync(filePath)
  const ext = extname(filePath).slice(1).toLowerCase()
  // jpeg 的 mime 是 image/jpeg，其他保持原样
  const mime = ext === 'jpg' ? 'jpeg' : ext
  return `data:image/${mime};base64,${buffer.toString('base64')}`
}
