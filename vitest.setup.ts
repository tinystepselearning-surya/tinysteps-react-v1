// vitest.setup.ts
// Global Vitest setup for TinySteps React:
// - Mock Firebase Analytics (no IndexedDB / analytics noise in tests)
// - Suppress known noisy console logs (act() warnings, emulator banners, etc.)

import { vi } from 'vitest'

// Provide a lightweight mock for firebase/auth so tests that read
// `getAuth().currentUser.uid` see a deterministic uid during unit tests.
vi.mock('firebase/auth', () => {
  // Provide both the named exports (connectAuthEmulator) and
  // a getAuth() that returns an `auth` object with `onAuthStateChanged`.
  const mockUser = {
    uid: 'test-admin-uid',
    email: 'admin@example.com',
    displayName: 'Test Admin',
    // Some code calls getIdTokenResult() on the user; provide a simple mock
    getIdTokenResult: async () => ({ claims: {} }),
  }

  return {
    getAuth: () => ({
      currentUser: mockUser,
      onAuthStateChanged: (cb: any) => {
        try {
          cb(mockUser)
        } catch (e) {
          // ignore
        }
        return () => {}
      },
    }),
    // Provide emulator connector no-op so firebaseConfig can call it in tests
    connectAuthEmulator: () => {},
    // some code imports onAuthStateChanged directly; provide a noop implementation
    onAuthStateChanged: (auth: any, cb: any) => {
      if (typeof cb === 'function') cb(mockUser)
      return () => {}
    },
    signOut: async () => {},
  }
})
// ---------------------------------------------------------------------------
// 1) Disable Firebase Analytics in the test environment
// ---------------------------------------------------------------------------

// In jsdom/Node tests we don't want real analytics or IndexedDB usage.
// These mocks make `isSupported()` false and no-op any logEvent calls.
vi.mock('firebase/analytics', () => ({
  isSupported: async () => false,
  getAnalytics: () => null,
  logEvent: () => {},
}))

// ❌ IMPORTANT: we do NOT mock "firebase/analytics/lite" here because
// your "firebase" package does NOT export "./analytics/lite".
// That missing export was exactly what caused:
//   Error: Missing "./analytics/lite" specifier in "firebase" package

// Pretend IndexedDB is not available to silence analytics / persistence attempts.
;(globalThis as any).indexedDB = undefined

// Ensure a working localStorage for the jsdom/vitest environment. Some
// test utilities (and `zustand`'s `persist` middleware) call
// `localStorage.setItem`/`getItem` during tests; make a minimal mock when
// it's not already provided by the environment. Use plain JS (no type
// annotations) to avoid transpilation/runtime edge cases.
if (typeof (globalThis as any).localStorage === 'undefined' || typeof (globalThis as any).localStorage.setItem !== 'function') {
  const store: Record<string, string> = {}
  ;(globalThis as any).localStorage = {
    getItem: (key: string) => (key in store ? (store as any)[key] : null),
    setItem: (key: string, value: string) => { (store as any)[key] = String(value) },
    removeItem: (key: string) => { delete (store as any)[key] },
    clear: () => { Object.keys(store).forEach(k => delete (store as any)[k]) },
  }
}

// ---------------------------------------------------------------------------
// 2) Filter noisy console output from Firebase + React act() warnings
// ---------------------------------------------------------------------------

const originalError = console.error.bind(console)
const originalWarn = console.warn.bind(console)
const originalInfo = console.info.bind(console)
const originalLog = console.log.bind(console)

// Substrings that, if present in any console argument, we want to hide
const SUPPRESS_SUBSTRINGS = [
  // React act(...) warnings
  'not wrapped in act(...)',
  'wrap-tests-with-act',
  'Learn more at https://reactjs.org/link/wrap-tests-with-act',

  // Firebase Analytics / IndexedDB spam
  '@firebase/analytics: Analytics: IndexedDB unavailable or restricted in this environment',
  'Firebase Analytics is not supported in this environment',
  'Error thrown when opening IndexedDB. Original error:',

  // Auth emulator banner
  'WARNING: You are using the Auth Emulator, which is intended for local testing only.',

  // Firestore emulator connection noise
  "Firestore (12.5.0): GrpcConnection RPC 'Listen' stream",
  'ECONNREFUSED 127.0.0.1:8085',

  // LP stats failure tests (intentional error scenario)
  'Error fetching LP stats',
  'Firestore fetch failed',

  // Optional: UI debug noise from tests
  'Debug: No user logged in',

  // -----------------------------------------------------------------------
  // Cloud Functions unit test logs (adminCreateUser, setUserRole, etc.)
  // -----------------------------------------------------------------------
  'Admin admin-uid creating user with role parent',
  'Admin callerUid creating user with role parent',
  'Created Firebase Auth user:',
  'admin.firestore availability',
  'Created Firestore document for user',
  'Set custom claims for new-uid',
  'Set custom claims for user', // generic pattern, future-safe
  'Generated password reset link for',
  'Password reset link:',
  'Successfully created user new-uid',
  'Successfully created user', // generic pattern

  // setUserRole-specific noise
  'Role updated: uid=',
  'Unauthorized setUserRole attempt by uid=unknown',

  // Unit test summary logs
  'unit test: adminCreateUser returned:',
]

// Convert any console arg into a string we can search against
function argToString(arg: unknown): string | null {
  if (typeof arg === 'string') return arg

  if (arg instanceof Error) {
    return arg.stack || arg.message || String(arg)
  }

  // For plain objects (like our structured log JSON), stringify so
  // we can match on fields like {"message":"admin.firestore availability"}
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg)
    } catch {
      // fall through to generic String()
    }
  }

  try {
    return String(arg)
  } catch {
    return null
  }
}

function shouldSuppress(args: unknown[]): boolean {
  return args.some((arg) => {
    const text = argToString(arg)
    if (!text) return false
    return SUPPRESS_SUBSTRINGS.some((pattern) => text.includes(pattern))
  })
}

console.error = (...args: any[]) => {
  if (shouldSuppress(args)) return
  return originalError(...args)
}

console.warn = (...args: any[]) => {
  if (shouldSuppress(args)) return
  return originalWarn(...args)
}

console.info = (...args: any[]) => {
  if (shouldSuppress(args)) return
  return originalInfo(...args)
}

console.log = (...args: any[]) => {
  if (shouldSuppress(args)) return
  return originalLog(...args)
}
