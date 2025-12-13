import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Firebase analytics: hard-disable in Node test environment
// ---------------------------------------------------------------------------
vi.mock('firebase/analytics', () => ({
  // isSupported is used by Firebase to guard analytics initialization.
  isSupported: async () => false,
  getAnalytics: () => null,
  logEvent: () => {},
}))

// ---------------------------------------------------------------------------
// IndexedDB: make it clearly unavailable unless a test explicitly polyfills it
// ---------------------------------------------------------------------------

// @ts-ignore
globalThis.indexedDB = undefined

// ---------------------------------------------------------------------------
// Console filtering: swallow ONLY known-noisy warnings
//   - Firebase Analytics IndexedDB / unsupported env
//   - Firestore emulator "Listen" / ECONNREFUSED in tests
//   - React "not wrapped in act(...)" warnings from async effects
// ---------------------------------------------------------------------------

const originalWarn = console.warn.bind(console)
const originalError = console.error.bind(console)

const silencedPatterns: string[] = [
  // Firebase Analytics / IndexedDB noise
  'Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments.',
  'IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments.',
  'Error thrown when opening IndexedDB. Original error:',

  // Firestore emulator connection noise (when no emulator is running in tests)
  "Firestore (12.5.0): GrpcConnection RPC 'Listen' stream",
  // Emulator connection string removed to avoid hard-coded localhost references

  // React act(...) warnings – these come from components with async state updates
  'Warning: An update to',
  'not wrapped in act(...)',
  'wrap-tests-with-act',
]

function shouldSilenceConsole(args: any[]): boolean {
  try {
    const text = args
      .map((arg) => {
        if (typeof arg === 'string') return arg
        if (arg instanceof Error) return arg.message
        if (arg && typeof arg.message === 'string') return arg.message
        try {
          return JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      })
      .join(' ')

    return silencedPatterns.some((pattern) => text.includes(pattern))
  } catch {
    return false
  }
}

console.warn = (...args: any[]) => {
  if (shouldSilenceConsole(args)) {
    return
  }
  return originalWarn(...args)
}

console.error = (...args: any[]) => {
  if (shouldSilenceConsole(args)) {
    return
  }
  return originalError(...args)
}

// ---------------------------------------------------------------------------
// Global test cleanup
// ---------------------------------------------------------------------------
afterEach(() => {
  try {
    cleanup()
  } finally {
    vi.clearAllMocks()
  }
})
