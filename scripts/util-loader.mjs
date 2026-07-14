/**
 * ESM loader that patches built-in modules to add APIs missing on Node 16:
 * - node:util: adds styleText (Node 20.12+) and parseEnv (Node 20.12+)
 * - node:crypto: adds getRandomValues as top-level export (Node 19+)
 *
 * Usage: node --experimental-loader=./scripts/util-loader.mjs
 *
 * For each patched module, we return a synthetic ESM module that:
 * 1. Uses createRequire with the loader's own URL (a valid file URL)
 * 2. Loads the real CJS module
 * 3. Adds polyfills if missing
 * 4. Re-exports all properties as named ESM exports + default export
 */

import { createRequire } from 'node:module'

// The loader's own URL is a valid file:// URL, safe for createRequire
const LOADER_URL = import.meta.url

// --- Pre-patch the CJS modules (so CJS require also benefits) ---
const require = createRequire(LOADER_URL)
const realUtil = require('util')
const realCrypto = require('crypto')

// Polyfill util.styleText
if (typeof realUtil.styleText !== 'function') {
  realUtil.styleText = function styleText(_format, text) {
    return String(text)
  }
}

// Polyfill util.parseEnv
if (typeof realUtil.parseEnv !== 'function') {
  realUtil.parseEnv = function parseEnv(content) {
    const env = {}
    for (const line of String(content).split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
    return env
  }
}

// Polyfill crypto.getRandomValues (delegates to webcrypto)
if (typeof realCrypto.getRandomValues !== 'function' && realCrypto.webcrypto) {
  realCrypto.getRandomValues = realCrypto.webcrypto.getRandomValues.bind(realCrypto.webcrypto)
}

// Collect export names
const utilExports = [...new Set([...Object.keys(realUtil), 'styleText', 'parseEnv'])]
const cryptoExports = [...new Set([...Object.keys(realCrypto), 'getRandomValues'])]

export async function load(url, context, nextLoad) {
  if (url === 'node:util') {
    return {
      format: 'module',
      source: buildUtilSource(),
      shortCircuit: true
    }
  }

  if (url === 'node:crypto') {
    return {
      format: 'module',
      source: buildCryptoSource(),
      shortCircuit: true
    }
  }

  return nextLoad(url, context)
}

function buildUtilSource() {
  const exportLines = utilExports
    .map((name) => `export const ${name} = __util[${JSON.stringify(name)}];`)
    .join('\n')

  return `
import { createRequire } from 'node:module';
const __require = createRequire(${JSON.stringify(LOADER_URL)});
const __util = __require('util');

if (typeof __util.styleText !== 'function') {
  __util.styleText = function(_format, text) { return String(text); };
}
if (typeof __util.parseEnv !== 'function') {
  __util.parseEnv = function(content) {
    const env = {};
    for (const line of String(content).split('\\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  };
}

${exportLines}
export default __util;
`
}

function buildCryptoSource() {
  const exportLines = cryptoExports
    .map((name) => `export const ${name} = __crypto[${JSON.stringify(name)}];`)
    .join('\n')

  return `
import { createRequire } from 'node:module';
const __require = createRequire(${JSON.stringify(LOADER_URL)});
const __crypto = __require('crypto');

// Polyfill getRandomValues as a top-level export (delegates to webcrypto)
if (typeof __crypto.getRandomValues !== 'function' && __crypto.webcrypto) {
  __crypto.getRandomValues = __crypto.webcrypto.getRandomValues.bind(__crypto.webcrypto);
}

${exportLines}
export default __crypto;
`
}
