// @vitest-environment happy-dom
import { StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider } from '../components/AuthProvider'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { GuestRoute } from '../components/GuestRoute'
import { useAuth } from '../hooks/useAuth'
import { SESSION_STORAGE_KEY } from '../model/session'

vi.mock('../../../shared/api/client', async () => {
  const { createHttpClient } = await import('../../../shared/api/http-client')
  return { api: createHttpClient({ baseUrl: 'https://example.test/api' }) }
})

let root: Root
let host: HTMLDivElement
let queryClient: QueryClient

const credentials = {
  userId: 'user-a', username: 'ivan', accessToken: 'access', refreshToken: 'x'.repeat(44),
  accessTokenExpiresAt: '2099-01-01T00:00:00Z', sessionId: 'existing-session',
}

function Login() {
  const { login } = useAuth()
  const location = useLocation()
  return <><span>Увійти</span><span>{(location.state as { from?: { pathname: string } })?.from?.pathname}</span>
    <button onClick={() => { void login({ emailOrUsername: 'ivan', password: 'password' }) }}>Вхід</button></>
}

function Private() {
  const { user, logout } = useAuth()
  return <><span>{user?.email}</span><button onClick={() => { void logout() }}>Вийти</button></>
}

async function render(path = '/home') {
  await act(async () => {
    root.render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider>
      <MemoryRouter initialEntries={[path]}><Routes>
        <Route element={<GuestRoute />}><Route path="/login" element={<Login />} /></Route>
        <Route element={<ProtectedRoute />}><Route path="/home" element={<Private />} /></Route>
      </Routes></MemoryRouter>
    </AuthProvider></QueryClientProvider></StrictMode>)
    await new Promise(resolve => setTimeout(resolve, 20))
  })
}

async function settle() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  sessionStorage.clear()
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  host.remove()
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('redirects an anonymous protected route and preserves the return destination', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  await render()
  expect(host.textContent).toContain('Увійти')
  expect(host.textContent).toContain('/home')
  expect(fetchMock).not.toHaveBeenCalled()
})

it('restores the user under StrictMode and redirects away from guest routes', async () => {
  const persistence = navigator.locks ? localStorage : sessionStorage
  persistence.setItem(SESSION_STORAGE_KEY, JSON.stringify(credentials))
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ id: 'user-a', username: 'ivan', email: 'ivan@example.com' }))
  await render('/login')
  await settle()
  expect(host.textContent).toContain('ivan@example.com')
  expect(fetchMock.mock.calls.every(([url]) => url === 'https://example.test/api/me')).toBe(true)
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer access')
})

it('logs in, fetches the private user query, and clears it on logout', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    if (String(url).endsWith('/auth/login')) return Response.json(credentials)
    if (String(url).endsWith('/auth/logout')) return new Response(null, { status: 204 })
    return Response.json({ id: 'user-a', username: 'ivan', email: 'ivan@example.com' })
  })
  await render('/login')
  await act(async () => { host.querySelector('button')!.click() })
  await settle()
  expect(host.textContent).toContain('ivan@example.com')
  const login = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/login'))!
  expect(JSON.parse(login[1]!.body as string)).toEqual({ emailOrUsername: 'ivan', password: 'password' })
  expect(new Headers(login[1]!.headers).has('Authorization')).toBe(false)
  await act(async () => { host.querySelector('button')!.click() })
  await settle()
  expect(host.textContent).toContain('Увійти')
  expect(host.textContent).not.toContain('ivan@example.com')
  expect(queryClient.getQueryCache().getAll().every(query => query.state.data === undefined)).toBe(true)
})

it('does not show protected content while restoration is pending or after rejection', async () => {
  const persistence = navigator.locks ? localStorage : sessionStorage
  persistence.setItem(SESSION_STORAGE_KEY, JSON.stringify(credentials))
  let resolve!: (response: Response) => void
  const pending = new Promise<Response>(accept => { resolve = accept })
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => pending)
  await render()
  expect(host.textContent).not.toContain('ivan@example.com')
  expect(host.textContent).not.toContain('Вийти')
  await act(async () => { resolve(Response.json({ detail: 'Invalid session' }, { status: 403 })) })
  await settle()
  expect(host.textContent).toContain('Увійти')
  expect(persistence.getItem(SESSION_STORAGE_KEY)).toBeNull()
})
