/**
 * Cross-platform test wrapper.
 * Node < 20: inject polyfills, then run vitest
 * Node >= 20: run vitest directly
 * Uses node to run vitest CLI entry, avoiding npx/.cmd/shell issues.
 */
const { spawn } = require('child_process')
const { resolve, dirname } = require('path')
const { pathToFileURL } = require('url')

const root = resolve(__dirname, '..')

var nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
var needsPolyfill = nodeMajor < 20

var env = Object.assign({}, process.env)

if (needsPolyfill) {
  var polyfill = resolve(__dirname, 'polyfill-node16.cjs')
  var loaderUrl = pathToFileURL(resolve(__dirname, 'util-loader.mjs')).href
  env.NODE_OPTIONS = [
    '--require=' + polyfill,
    '--experimental-loader=' + loaderUrl,
    process.env.NODE_OPTIONS || ''
  ].filter(Boolean).join(' ')
}

var vitestPkgPath = require.resolve('vitest/package.json')
var vitestPkg = require(vitestPkgPath)
var binField = typeof vitestPkg.bin === 'string' ? vitestPkg.bin : (vitestPkg.bin.vitest || vitestPkg.bin.cli)
var vitestBinPath = resolve(dirname(vitestPkgPath), binField)

var extraArgs = process.argv.slice(2)
var isWatch = extraArgs.indexOf('--watch') >= 0 || extraArgs.indexOf('-w') >= 0
var vitestArgs = isWatch
  ? extraArgs.filter(function(a) { return a !== '--watch' && a !== '-w' })
  : ['run'].concat(extraArgs)

var child = spawn(process.execPath, [vitestBinPath].concat(vitestArgs), {
  stdio: 'inherit',
  cwd: root,
  env: env,
  shell: false
})

child.on('exit', function(code) {
  process.exit(code || 1)
})
