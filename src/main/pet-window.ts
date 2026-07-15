import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { loadConfig, saveConfig } from './config'

let petWindow: BrowserWindow | null = null

/** 桌宠窗口尺寸 */
const PET_WIDTH = 200
const PET_HEIGHT = 280

/** 获取桌宠初始位置（从配置读取，-1 表示右下角默认位置） */
function getInitialPosition(): { x: number; y: number } {
  const config = loadConfig()
  if (config.petX >= 0 && config.petY >= 0) {
    return { x: config.petX, y: config.petY }
  }
  // 默认放在右下角
  const { workArea } = screen.getPrimaryDisplay()
  return {
    x: workArea.x + workArea.width - PET_WIDTH - 20,
    y: workArea.y + workArea.height - PET_HEIGHT - 20
  }
}

/**
 * 创建桌宠窗口：透明、无边框、置顶、不在任务栏显示
 */
export function createPetWindow(): BrowserWindow {
  const { x, y } = getInitialPosition()

  petWindow = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // 默认透明区域点击穿透，但事件转发到渲染进程
  petWindow.setIgnoreMouseEvents(true, { forward: true })

  if (process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/pet.html')
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet.html'))
  }

  petWindow.once('ready-to-show', () => {
    const config = loadConfig()
    if (config.petEnabled) {
      petWindow?.show()
    }
  })

  // 窗口移动时防抖保存位置
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  petWindow.on('move', () => {
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      savePetPosition()
    }, 500)
  })

  return petWindow
}

/** 获取桌宠窗口实例 */
export function getPetWindow(): BrowserWindow | null {
  return petWindow
}

/** 显示/隐藏桌宠 */
export function togglePet(): void {
  if (!petWindow) return
  if (petWindow.isVisible()) {
    petWindow.hide()
  } else {
    petWindow.show()
  }
}

/** 设置桌宠是否可交互（关闭/开启点击穿透） */
export function setPetInteractive(interactive: boolean): void {
  if (!petWindow) return
  petWindow.setIgnoreMouseEvents(!interactive, { forward: !interactive })
}

/** 移动桌宠到绝对位置 */
export function movePet(x: number, y: number): void {
  if (!petWindow) return
  petWindow.setPosition(Math.round(x), Math.round(y))
}

/** 获取桌宠当前位置 */
export function getPetPosition(): { x: number; y: number } {
  if (!petWindow) return { x: -1, y: -1 }
  const [x, y] = petWindow.getPosition()
  return { x, y }
}

/** 保存桌宠位置到配置文件 */
export function savePetPosition(): void {
  if (!petWindow) return
  const [x, y] = petWindow.getPosition()
  const config = loadConfig()
  saveConfig({ ...config, petX: x, petY: y })
}

/** 销毁桌宠窗口 */
export function destroyPetWindow(): void {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.destroy()
  }
  petWindow = null
}
