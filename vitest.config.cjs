/**
 * Vitest 配置（CJS 格式，兼容 Node 16）。
 * - @shared / @renderer 路径别名
 * - electron 指向 mock 模块，避免加载真实 Electron 二进制
 */
const { resolve } = require('path')

/** @type {import('vitest/config').UserConfig} */
module.exports = {
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      electron: resolve(__dirname, 'scripts/mock-electron.cjs')
    }
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**']
  }
}
