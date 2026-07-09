import { app } from 'electron'

/**
 * 设置开机自启状态。
 * Windows 下通过注册表 HKCU\Software\Microsoft\Windows\CurrentVersion\Run 实现。
 */
export function setAutoStart(enabled: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      // Windows 下设置可执行文件路径
      args: ['--hidden']
    })
  } catch (err) {
    console.error('设置开机自启失败:', err)
  }
}

/**
 * 读取系统当前的开机自启状态。
 */
export function getAutoStart(): boolean {
  try {
    const settings = app.getLoginItemSettings()
    return settings.openAtLogin
  } catch {
    return false
  }
}

/**
 * 根据配置同步系统开机自启状态。
 * 启动时调用，确保系统状态与配置一致。
 */
export function syncAutoStart(enabled: boolean): void {
  const current = getAutoStart()
  if (current !== enabled) {
    setAutoStart(enabled)
  }
}
