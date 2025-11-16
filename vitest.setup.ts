import { vi } from 'vitest'

// Mock framer-motion to avoid RAF scheduling during tests
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    motion: {
      // simple passthrough wrapper for motion components
      div: ({ children, ...props }: any) => {
        return (props && props.children) ? (props.children) : null
      },
      button: ({ children, ...props }: any) => {
        return (props && props.children) ? (props.children) : null
      },
      span: ({ children, ...props }: any) => {
        return (props && props.children) ? (props.children) : null
      },
    },
  }
})

// Stub requestAnimationFrame to run callbacks immediately
const rafBackup = globalThis.requestAnimationFrame
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(0), 0) as unknown as number
}

// Restore RAF in afterAll
vi.afterAll(() => {
  // @ts-ignore
  if (rafBackup) globalThis.requestAnimationFrame = rafBackup
})

// Ensure fake timers are used by default in tests that rely on timers
vi.beforeEach(() => {
  vi.useFakeTimers()
})
vi.afterEach(() => {
  vi.useRealTimers()
})
