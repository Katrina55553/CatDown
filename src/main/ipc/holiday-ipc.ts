import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import {
  loadHolidayEntries,
  addHoliday,
  removeHoliday,
  resetHolidays
} from '../holidays'

/**
 * 注册节假日相关 IPC：获取 / 新增 / 删除 / 重置。
 */
export function registerHolidayIpc(): void {
  ipcMain.handle(IPC_CHANNELS.GET_HOLIDAYS, () => {
    return loadHolidayEntries()
  })

  ipcMain.handle(IPC_CHANNELS.ADD_HOLIDAY, (_event, date: string, name: string) => {
    return addHoliday(date, name)
  })

  ipcMain.handle(IPC_CHANNELS.REMOVE_HOLIDAY, (_event, date: string) => {
    return removeHoliday(date)
  })

  ipcMain.handle(IPC_CHANNELS.RESET_HOLIDAYS, () => {
    return resetHolidays()
  })
}
