// @vitest-environment happy-dom
import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../model/auth-context'
import { createAuthSession, SESSION_STORAGE_KEY } from '../model/session'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { AccountConnections } from '../components/AccountConnections'
import { authApi } from '../api/auth.api'
import type { SessionUser } from '../types/session'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

vi.mock('../constants/auth', () => ({ GOOGLE_CLIENT_ID: 'test-client' }))
vi.mock('../api/auth.api', () => ({ authApi: { loginWithGoogle: vi.fn(), linkGoogle: vi.fn(), login: vi.fn(), verifyEmail: vi.fn() } }))

let root: Root
let host: HTMLDivElement
let credentialCallback: (response: { credential: string }) => void
let click: () => void
let queryClient: QueryClient
const tokens = { userId: 'user-a', username: 'ivan', accessToken: 'access', refreshToken: 'x'.repeat(44), accessTokenExpiresAt: '2099-01-01T00:00:00Z' }
const sessionApi = { refresh: vi.fn(async () => tokens), logout: vi.fn(async () => undefined) }

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  queryClient = new QueryClient()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  window.google = { accounts: { id: {
    initialize: options => { credentialCallback = options.callback },
    renderButton: (_element, options) => { click = options.click_listener },
  } } }
  vi.mocked(authApi.loginWithGoogle).mockResolvedValue(tokens)
  vi.mocked(authApi.linkGoogle).mockResolvedValue(undefined)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  queryClient.clear()
  sessionStorage.clear()
  delete window.google
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

it('skips initialization when the Google container is detached before effects run', async () => {
  const initialize = vi.spyOn(window.google!.accounts.id, 'initialize')
  const session = createAuthSession(queryClient, sessionApi, sessionStorage)
  function DetachedGoogleButton() {
    const { buttonRef } = useGoogleAuth({ mode: 'signin' })
    useLayoutEffect(() => {
      const container = buttonRef.current!
      const wrapper = container.parentElement!
      container.remove()
      return () => { wrapper.append(container) }
    }, [buttonRef])
    return <div ref={buttonRef} />
  }
  await act(async () => root.render(<MemoryRouter><AuthContext.Provider value={{ session, user: null, isLoading: false, error: null }}><DetachedGoogleButton /></AuthContext.Provider></MemoryRouter>))
  expect(initialize).not.toHaveBeenCalled()
})

it('submits a Google ID token once and persists the API token pair', async () => {
  const session = createAuthSession(queryClient, sessionApi, sessionStorage)
  await act(async () => root.render(<MemoryRouter><AuthContext.Provider value={{ session, user: null, isLoading: false, error: null }}><GoogleAuthButton /></AuthContext.Provider></MemoryRouter>))
  await act(async () => { click(); credentialCallback({ credential: 'google-id-token' }); credentialCallback({ credential: 'google-id-token' }) })
  expect(authApi.loginWithGoogle).toHaveBeenCalledTimes(1)
  expect(authApi.loginWithGoogle).toHaveBeenCalledWith({ idToken: 'google-id-token' }, expect.any(AbortSignal))
  expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!).accessToken).toBe('access')
})

it('rejects a Google callback captured before account switching', async () => {
  const session = createAuthSession(queryClient, sessionApi, sessionStorage)
  await act(async () => root.render(<MemoryRouter><AuthContext.Provider value={{ session, user: null, isLoading: false, error: null }}><GoogleAuthButton /></AuthContext.Provider></MemoryRouter>))
  await act(async () => { click(); await session.authenticate(async () => ({ ...tokens, userId: 'user-b' })); credentialCallback({ credential: 'stale-google-token' }) })
  expect(authApi.loginWithGoogle).not.toHaveBeenCalled()
  expect(host.querySelector('[role="alert"]')!.textContent).toContain('Сесію змінено.')
})

it('shows the linked confirmation after a successful popup without reloading the page', async () => {
  const session = createAuthSession(queryClient, sessionApi, sessionStorage)
  await session.authenticate(async () => tokens)
  const user = {
    id: 'user-a', username: 'ivan', email: 'ivan@example.com', displayName: null,
    avatarUrl: null, bannerUrl: null, bio: null, role: 'User', isVerified: true,
    followersCount: 0, followingCount: 0, postsCount: 0, isFollowedByCurrentUser: false, createdAt: '',
  } satisfies SessionUser
  await act(async () => root.render(<MemoryRouter><AuthContext.Provider value={{ session, user, isLoading: false, error: null }}><AccountConnections /></AuthContext.Provider></MemoryRouter>))
  await act(async () => { click(); credentialCallback({ credential: 'google-id-token' }) })
  expect(authApi.linkGoogle).toHaveBeenCalledWith({ idToken: 'google-id-token' }, expect.any(AbortSignal))
  expect(host.textContent).toContain('Google успішно прив’язано.')
  expect(host.textContent).not.toContain('Перехід до Google')
})
