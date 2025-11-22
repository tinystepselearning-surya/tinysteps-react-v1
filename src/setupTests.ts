import { vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'

// Mock framer-motion to avoid animation/RAF scheduling during tests
vi.mock('framer-motion', () => {
  const React = require('react')
  const motion = new Proxy({}, {
    get: (_, prop) => {
      // Return a simple functional component that renders as a native element
      return ({ children, ...rest }: { children?: React.ReactNode; [k: string]: any }) => {
        // Remove common animation props which would cause React to forward them to DOM
        const filtered = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !['initial', 'animate', 'whileHover', 'whileTap', 'whileDrag', 'transition', 'variants'].includes(k))
        )
        return React.createElement(typeof prop === 'string' ? (prop as any) : 'div', filtered as any, children)
      }
    }
  })
  return {
    motion,
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  }
})

// Stub requestAnimationFrame to run synchronously during tests.
// Some components (framer-motion) use RAF and cause act warnings if RAF is not stubbed.
const rafBackup = globalThis.requestAnimationFrame

beforeEach(() => {
  // stub RAF to call immediately (framer-motion uses RAF internally)
   
  // @ts-ignore
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
})

afterEach(() => {
   
  // @ts-ignore
  globalThis.requestAnimationFrame = rafBackup
  vi.restoreAllMocks()
})

export {}
