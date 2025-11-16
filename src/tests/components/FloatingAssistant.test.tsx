import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import FloatingAssistant from '../../components/common/FloatingAssistant'
import useAuthStore from '../../store/useAuthStore'
import { act } from 'react'

describe('FloatingAssistant', () => {
  const rafBackup = global.requestAnimationFrame
  beforeEach(() => {
    vi.useFakeTimers()
    // stub requestAnimationFrame to immediate callback to avoid animation scheduling triggers
    // framer-motion uses RAF internally which can cause unwrapped updates in tests
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.requestAnimationFrame = (cb) => cb(0)
  })

  afterEach(() => {
    useAuthStore.setState({ user: null })
    vi.useRealTimers()
    // restore RAF
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.requestAnimationFrame = rafBackup
  })

  it('renders for anonymous users', async () => {
    act(() => useAuthStore.setState({ user: null }))
    act(() => render(<FloatingAssistant />))
    // advance timers to flush the setTimeout in the component
  await act(async () => { vi.runAllTimers(); await Promise.resolve() })
    expect(screen.getByText(/Ask TinySteps/i)).toBeInTheDocument()
    expect(screen.getByText(/WhatsApp Advisor/i)).toBeInTheDocument()
  })

  it('does not render for logged-in users', async () => {
    act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' } }))
    act(() => render(<FloatingAssistant />))
  await act(async () => { vi.runAllTimers(); await Promise.resolve() })
    // should not find the label
    expect(screen.queryByText(/Ask TinySteps/i)).toBeNull()
  })
})
