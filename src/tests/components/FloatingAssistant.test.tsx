import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import FloatingAssistant from '../../components/common/FloatingAssistant'
import useAuthStore from '../../store/useAuthStore'
import * as analytics from '../../lib/analytics'

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

  const openChat = async () => {
    // The actual chat dialog is loaded with React.lazy. Wait for its
    // module and Suspense boundary instead of synchronously querying text
    // immediately after the bubble click.
    await act(async () => {
      const launcher = screen.queryByRole('button', { name: 'Open support options' });
      if (launcher) fireEvent.click(launcher);
      fireEvent.click(screen.getByRole('button', { name: 'Ask TinySteps AI' }))
      await import('../../components/common/AskTinyStepsModal')
    })
    expect(screen.getByRole('dialog', { name: 'Ask TinySteps' })).toBeVisible()
  }

  it('shows a quiet homepage dock without animated pings', async () => {
    await renderWidget()

    expect(document.querySelectorAll('[data-floating-assistant="1"]').length).toBe(1)
    expect(screen.getByRole('button', { name: 'Open support options' })).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelector('#homepage-support-actions')).toHaveClass('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'Open support options' }))
    expect(screen.getByRole('button', { name: 'Close support options' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
    expect(screen.queryByText('Live assistant')).toBeNull()
    expect(document.querySelectorAll('.animate-ping')).toHaveLength(0)
  })

  it('hides the dock on homepage booking section without closing an open chat', async () => {
    const utils = await renderWidget();
    await openChat();

    utils.rerender(
      <MemoryRouter initialEntries={['/']}>
        <FloatingAssistant suppressDock />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-floating-assistant="1"]')).toHaveClass('hidden');
    expect(screen.getByRole('dialog', { name: 'Ask TinySteps' })).toBeVisible();
  });

  it('stays compact on dense Speaking curriculum course pages', async () => {
    await renderWidget('/courses/public-speaking-foundations')

    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
    expect(screen.queryByText('Live assistant')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(screen.queryByText('Live assistant')).toBeNull()
  })

  it('auto-collapses and auto-expands on specialist pages only', async () => {
    await renderWidget('/phonics')

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

  it('does not auto-expand or pulse on homepage after twenty seconds', async () => {
    await renderWidget('/')
    act(() => {
      vi.advanceTimersByTime(20000)
    })
    expect(screen.queryByText('Live assistant')).toBeNull()
    expect(document.querySelectorAll('.animate-ping')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Open support options' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the AI modal from the bubble button', async () => {
    await renderWidget()

    await openChat()
  })

  it('still opens the AI modal when analytics tracking throws', async () => {
    const trackEventSpy = vi.spyOn(analytics, 'trackEvent').mockImplementation(() => {
      throw new Error('tracking failed')
    })

    await renderWidget()

    await openChat()

    trackEventSpy.mockRestore()
  })

  it('renders on public routes even when a user is authenticated', async () => {
    await renderWidget('/', { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' })
    expect(screen.getByRole('button', { name: 'Open support options' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open support options' }))
    expect(screen.getByRole('button', { name: 'Ask TinySteps AI' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat on WhatsApp' })).toBeInTheDocument()
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
