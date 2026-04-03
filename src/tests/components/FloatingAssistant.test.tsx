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
    window.localStorage.clear()

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
  })

  it('opens the AI panel and collapse returns to the compact dock', async () => {
    await renderAnonymousWidget()

    fireEvent.click(screen.getByRole('button', { name: 'Ask TinySteps AI' }))
    expect(screen.getByText(/Need help choosing a program/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Collapse'))
    expect(screen.queryByText(/Need help choosing a program/i)).toBeNull()
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
  })

  it('hide only dismisses the panel and the dock stays visible after reload', async () => {
    const firstRender = await renderAnonymousWidget()

    fireEvent.click(screen.getByRole('button', { name: 'Ask TinySteps AI' }))
    fireEvent.click(screen.getByText('Hide'))

    expect(window.localStorage.getItem('ts_floating_assistant_panel_dismissed')).toBe('1')
    expect(screen.queryByText(/Need help choosing a program/i)).toBeNull()
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()

    firstRender.unmount()
    await renderAnonymousWidget()

    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
    expect(screen.queryByText(/Need help choosing a program/i)).toBeNull()
  })

  it('migrates bad legacy hidden state so the compact dock is visible again', async () => {
    window.localStorage.setItem('ts_floating_assistant_hidden', '1')
    window.localStorage.setItem('ts_floating_assistant_collapsed', '1')

    await renderAnonymousWidget()

    expect(window.localStorage.getItem('ts_floating_assistant_hidden')).toBeNull()
    expect(window.localStorage.getItem('ts_floating_assistant_collapsed')).toBeNull()
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
  })

  it('does not render for logged-in users in tests', async () => {
    act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' } }))
    act(() => render(<FloatingAssistant />))
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByRole('button', { name: 'Ask TinySteps AI' })).toBeNull()
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
