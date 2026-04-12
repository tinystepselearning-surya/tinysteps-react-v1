import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
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

  const renderWidget = async (path = '/', user: any = null) => {
    act(() => useAuthStore.setState({ user }))
    const utils = render(
      <MemoryRouter initialEntries={[path]}>
        <FloatingAssistant />
      </MemoryRouter>
    )
    await act(async () => {
      await Promise.resolve()
    })
    return utils
  }

  it('shows the compact dock by default with exactly one widget mount', async () => {
    await renderWidget()

    expect(document.querySelectorAll('[data-floating-assistant="1"]').length).toBe(1)
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
    expect(screen.getByText('Live assistant')).toBeInTheDocument()
  })

  it('auto-collapses and auto-expands every 10 seconds', async () => {
    await renderWidget()

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
    await renderWidget()

    fireEvent.click(screen.getByRole('button', { name: 'Ask TinySteps AI' }))
    expect(screen.getAllByText(/TinySteps AI/i).length).toBeGreaterThan(0)
  })

  it('does not render when a user is authenticated, even on public routes', async () => {
    await renderWidget('/', { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' })
    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('does not render on protected app routes even if auth store user is null', async () => {
    await renderWidget('/surya')

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('does not render on protected alias routes', async () => {
    await renderWidget('/admin')

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('does not render on learning partner dashboard routes', async () => {
    await renderWidget('/learning-partner/dashboard')

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('does not render on login routes', async () => {
    await renderWidget('/teacher/login')

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Chat on WhatsApp' })).toBeNull()
  })
})
