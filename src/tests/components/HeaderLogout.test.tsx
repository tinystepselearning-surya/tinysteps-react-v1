import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import Header from '../../components/common/Header'
import { ParentHeader } from '../../pages/parent/components/layout/ParentHeader'
import useAuthStore from '../../store/useAuthStore'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    signOut: vi.fn(() => Promise.resolve()),
  };
})

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Header logout', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null })
    mockNavigate.mockReset()
  })

  it('redirects parent to parent login after logout', async () => {
  act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'p@test.com', displayName: 'Parent', role: 'parent' }, clearUser: vi.fn() }))
    await act(async () => {
      render(
        <MemoryRouter>
          <ParentHeader name="Test Parent" totalChildren={1} />
        </MemoryRouter>
      )
      await Promise.resolve()
    })

    // Find logout text in header (desktop or mobile)
  const logoutButton = screen.getByText(/Logout/i)
    expect(logoutButton).toBeTruthy()
  await act(async () => {
    fireEvent.click(logoutButton!)
    // wait for async work (signOut -> clearUser -> navigate) to finish inside act
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/parent/login'))
  })
  })
})
