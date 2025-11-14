import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Prevent firebase/analytics from attempting IndexedDB access during Node tests.
// Many firebase analytics APIs call IndexedDB when running in browser-like
// environments; in the test runner we prefer to disable analytics entirely.
vi.mock('firebase/analytics', () => ({
	// isSupported is used by Firebase to guard analytics initialization.
	isSupported: async () => false,
	getAnalytics: () => null,
	logEvent: () => {},
}))

// Some libraries attempt to access indexedDB directly. Ensure it's undefined in the
// test environment to avoid misleading runtime warnings.
// (If a test needs a real indexedDB, it should polyfill it explicitly.)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.indexedDB = undefined

// Filter noisy console warnings about IndexedDB/analytics in tests to keep output
// focused on failures. We still print other warnings.
const originalWarn = console.warn.bind(console)
console.warn = (...args: any[]) => {
	try {
		const msg = args[0]
		if (typeof msg === 'string' && (msg.includes('IndexedDB') || msg.includes('analytics'))) {
			return
		}
	} catch (e) {
		// fallthrough to default warn
	}
	return originalWarn(...args)
}

// Ensure cleanup after each test and clear mocks to avoid cross-test leakage.
afterEach(() => {
	try {
		cleanup()
	} finally {
		vi.clearAllMocks()
	}
})
