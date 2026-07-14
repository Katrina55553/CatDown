/**
 * Polyfills for running vitest 4 / vite 8 on Node 16:
 * 1. node:util.styleText (added in Node 20.12+)
 * 2. globalThis.crypto.getRandomValues (Web Crypto API global, Node 19+)
 *
 * Loaded via NODE_OPTIONS=--require=./scripts/polyfill-node16.cjs
 */

// --- 1. Polyfill crypto.getRandomValues on the global crypto object ---
if (typeof globalThis.crypto?.getRandomValues !== 'function') {
  const { webcrypto } = require('crypto')
  if (webcrypto && typeof webcrypto.getRandomValues === 'function') {
    // Node 16 has webcrypto via require('crypto').webcrypto
    if (!globalThis.crypto) {
      globalThis.crypto = webcrypto
    } else {
      // If crypto exists but getRandomValues is missing, copy it
      globalThis.crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto)
    }
  }
}

// --- 2. Polyfill util.styleText on the CJS module (helps some import paths) ---
const util = require('util')
if (typeof util.styleText !== 'function') {
  util.styleText = function styleText(_format, text) {
    return String(text)
  }
}

// --- 3. Polyfill Array.prototype.findLastIndex (Node 18+) ---
if (typeof Array.prototype.findLastIndex !== 'function') {
  Array.prototype.findLastIndex = function findLastIndex(callback, thisArg) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback.call(thisArg, this[i], i, this)) {
        return i
      }
    }
    return -1
  }
}

// --- 4. Polyfill Array.prototype.findLast (Node 18+) ---
if (typeof Array.prototype.findLast !== 'function') {
  Array.prototype.findLast = function findLast(callback, thisArg) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback.call(thisArg, this[i], i, this)) {
        return this[i]
      }
    }
    return undefined
  }
}

// --- 5. Polyfill Array.prototype.at (Node 16.6+ may have it, but just in case) ---
if (typeof Array.prototype.at !== 'function') {
  Array.prototype.at = function at(index) {
    const len = this.length
    const i = index < 0 ? len + index : index
    return i >= 0 && i < len ? this[i] : undefined
  }
}
