import { beforeEach, describe, expect, it } from 'vitest'
import useAuthStore, { AuthUser } from '../../store/useAuthStore'

beforeEach(() => {
  // Clear persisted storage and reset store state between tests
  try {
    localStorage.removeItem('auth-store')
  } catch (e) {
    // ignore if not available
  }
  // Reset in-memory store
  useAuthStore.setState({ user: null, isLoading: false })
})

describe('useAuthStore', () => {
  it('sets and returns user via setUser', () => {
    const user: AuthUser = {
      uid: 'u1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'parent',
    }

    useAuthStore.getState().setUser(user)
    const stored = useAuthStore.getState().user
    expect(stored).toEqual(user)
  })

  it('clears user via clearUser', () => {
    const user: AuthUser = {
      uid: 'u2',
      email: 'foo@example.com',
      displayName: 'Foo',
      role: 'teacher',
    }

    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).not.toBeNull()

    useAuthStore.getState().clearUser()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('sets loading flag via setLoading', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)

    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('persists user to localStorage', () => {
    const user: AuthUser = {
      uid: 'u3',
      email: 'persist@example.com',
      displayName: 'Persist',
      role: 'admin',
    }

    useAuthStore.getState().setUser(user)

    const raw = localStorage.getItem('auth-store')
    expect(raw).toBeTruthy()
    if (raw) {
      expect(raw).toContain('persist@example.com')
    }
  })
})
