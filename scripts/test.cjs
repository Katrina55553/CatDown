/**
 * Cross-platform test runner that sets up Node 16 polyfills before running vitest.
 *
 * vitest 4 / vite 8 require Node 20+, but the dev environment may have Node 16.
 * This wrapper injects polyfills via NODE_OPTIONS so `npm test` just works.
 *
 * On Node 20+ the polyfills are no-ops (all features already exist).
 */
const { spawn } = require('child_process')
const { resolve } = require('path')
const { pathToFileURL } = require('url')

const root = resolve(__dirname, '..')
const polyfill = resolve(__dirname, 'polyfill-node16.cjs')
// --experimental-loader requires a file:// URL on Windows
const loaderUrl = pathToFileURL(resolve(__dirname, 'util-loader.mjs')).href

const env = { ...process.env }
env.NODE_OPTIONS = [
  `--require=${polyfill}`,
  `--experimental-loader=${loaderUrl}`,
  process.env.NODE_OPTIONS || ''
].filter(Boolean).join(' ')

// On Windows, npx is npx.cmd
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const extraArgs = process.argv.slice(2)

const child = spawn(cmd, ['vitest', 'run', ...extraArgs], {
  stdio: 'inherit',
  cwd: root,
  env,
  shell: false
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
