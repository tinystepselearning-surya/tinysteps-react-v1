import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { vi } from 'vitest'
import FloatingAssistant from '../../components/common/FloatingAssistant'
import useAuthStore from '../../store/useAuthStore'

describe('FloatingAssistant', () => {
  const rafBackup = global.requestAnimationFrame

  beforeEach(() => {
    vi.useFakeTimers()

    // @ts-ignore
    global.requestAnimationFrame = (cb) => cb(0)
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    useAuthStore.setState({ user: null })
    window.history.replaceState({}, '', '/')
    vi.useRealTimers()

    // @ts-ignore
    global.requestAnimationFrame = rafBackup
  })

  const renderAnonymousWidget = async () => {
    act(() => useAuthStore.setState({ user: null }))
    const utils = render(<FloatingAssistant />)
    await act(async () => {
      await Promise.resolve()
    })
    return utils
  }

  it('shows the compact dock by default with exactly one widget mount', async () => {
    await renderAnonymousWidget()

    expect(document.querySelectorAll('[data-floating-assistant="1"]').length).toBe(1)
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
    expect(screen.getByText('Live assistant')).toBeInTheDocument()
  })

  it('auto-collapses and auto-expands every 10 seconds', async () => {
    await renderAnonymousWidget()

    expect(screen.getByText('Live assistant')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.queryByText('Live assistant')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByText('Live assistant')).toBeInTheDocument()
  })

  it('opens the AI modal from the bubble button', async () => {
    await renderAnonymousWidget()

    fireEvent.click(screen.getByRole('button', { name: 'Ask TinySteps AI' }))
    expect(screen.getAllByText(/TinySteps AI/i).length).toBeGreaterThan(0)
  })

  it('renders on public routes even when a user is present in auth store', async () => {
    act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' } }))
    act(() => render(<FloatingAssistant />))
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
  })

  it('does not render on protected app routes even if auth store user is null', async () => {
    window.history.pushState({}, '', '/surya')
    await renderAnonymousWidget()

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('does not render on login routes', async () => {
    window.history.pushState({}, '', '/teacher/login')
    await renderAnonymousWidget()

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })
})
