import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { createAuthSession, SESSION_STORAGE_KEY } from '../model/session'
import { createHttpClient } from '../../../shared/api/http-client'
import { ApiError } from '../../../shared/api/api-error'

function storage() {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null,
  } satisfies Storage
}

function deferred<Value>() {
  let resolve!: (value: Value) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<Value>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

const response = (accessToken = 'first', userId = 'user-a') => ({
  userId, username: userId, accessToken, refreshToken: accessToken.padEnd(44, 'x'),
  accessTokenExpiresAt: '2099-01-01T00:00:00Z',
})

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const persistence = storage()
  const api = { refresh: vi.fn(async () => response('rotated')), logout: vi.fn(async () => undefined) }
  const session = createAuthSession(queryClient, api, persistence)
  return { queryClient, persistence, api, session }
}

describe('authentication session lifecycle', () => {
  it('persists one validated token pair and restores it', async () => {
    const { queryClient, persistence, api, session } = setup()
    await session.authenticate(async () => response())
    const restored = createAuthSession(queryClient, api, persistence)
    await restored.restore()
    expect(restored.transport.capture().accessToken).toBe('first')
    expect(api.refresh).not.toHaveBeenCalled()
    expect(JSON.parse(persistence.getItem(SESSION_STORAGE_KEY)!).refreshToken).toHaveLength(44)
  })

  it('coalesces concurrent refreshes and handles late old-token failures', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    const snapshot = session.transport.capture()
    const refresh = deferred<ReturnType<typeof response>>()
    api.refresh.mockImplementation(() => refresh.promise)
    const first = session.transport.refresh(snapshot)
    const second = session.transport.refresh(snapshot)
    expect(api.refresh).toHaveBeenCalledTimes(1)
    refresh.resolve(response('rotated'))
    await Promise.all([first, second])
    await session.transport.refresh(snapshot)
    expect(api.refresh).toHaveBeenCalledTimes(1)
    expect(session.transport.capture().accessToken).toBe('rotated')
  })

  it('clears credentials, queries, and mutations after rejected refresh', async () => {
    const { session, api, queryClient, persistence } = setup()
    await session.authenticate(async () => response())
    queryClient.setQueryData(['private'], { email: 'private@example.com' })
    queryClient.getMutationCache().build(queryClient, { mutationKey: ['private'] })
    api.refresh.mockRejectedValue(new ApiError('Invalid refresh token', { status: 401 }))
    await expect(session.transport.refresh(session.transport.capture())).rejects.toThrow('Invalid refresh token')
    expect(session.hasSession()).toBe(false)
    expect(persistence.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
  })

  it('clears locally even when server logout fails', async () => {
    const { session, api, queryClient } = setup()
    await session.authenticate(async () => response())
    const old = session.transport.capture()
    queryClient.setQueryData(['private'], 'secret')
    api.logout.mockRejectedValue(new Error('offline'))
    await expect(session.logout()).rejects.toThrow('offline')
    expect(session.hasSession()).toBe(false)
    expect(session.transport.isCurrent(old)).toBe(false)
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })

  it('never restores tokens when refresh finishes after logout', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    const refresh = deferred<ReturnType<typeof response>>()
    api.refresh.mockImplementation(() => refresh.promise)
    const pending = session.transport.refresh(session.transport.capture())
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await session.logout()
    refresh.resolve(response('rotated'))
    await rejected
    expect(session.hasSession()).toBe(false)
    expect(api.logout).toHaveBeenCalledWith(response('rotated').refreshToken)
  })

  it('prevents a stale refresh from overwriting a different account', async () => {
    const { session, api, queryClient } = setup()
    await session.authenticate(async () => response())
    const refresh = deferred<ReturnType<typeof response>>()
    api.refresh.mockImplementation(() => refresh.promise)
    const pending = session.transport.refresh(session.transport.capture())
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await session.authenticate(async () => response('second', 'user-b'))
    queryClient.setQueryData(['new-user'], 'keep')
    refresh.resolve(response('rotated'))
    await rejected
    expect(session.transport.capture().accessToken).toBe('second')
    expect(queryClient.getQueryData(['new-user'])).toBe('keep')
  })

  it('rejects a stale login completion after logout', async () => {
    const { session } = setup()
    const login = deferred<ReturnType<typeof response>>()
    const pending = session.authenticate(() => login.promise)
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await session.logout()
    login.resolve(response())
    await rejected
    expect(session.hasSession()).toBe(false)
  })

  it('only accepts the latest concurrent authentication attempt', async () => {
    const { session } = setup()
    const first = deferred<ReturnType<typeof response>>()
    const pending = session.authenticate(() => first.promise)
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await session.authenticate(async () => response('second', 'user-b'))
    first.resolve(response())
    await rejected
    expect(session.transport.capture().accessToken).toBe('second')
  })

  it('drops malformed stored credentials', () => {
    const { queryClient, persistence, api } = setup()
    persistence.setItem(SESSION_STORAGE_KEY, '{broken')
    const session = createAuthSession(queryClient, api, persistence)
    expect(session.hasSession()).toBe(false)
  })

  it('synchronizes account changes and logout across shared storage', async () => {
    const { queryClient, persistence, api, session } = setup()
    await session.authenticate(async () => response())
    const other = createAuthSession(queryClient, api, persistence)
    const old = other.transport.capture()
    await session.authenticate(async () => response('second', 'user-b'))
    expect(other.transport.isCurrent(old)).toBe(false)
    await session.logout()
    other.synchronize()
    expect(other.hasSession()).toBe(false)
  })

  it('refreshes expired credentials on restoration', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => ({ ...response(), accessTokenExpiresAt: '2000-01-01T00:00:00Z' }))
    await session.restore()
    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it('serializes refresh across two tabs and reuses the rotated token', async () => {
    const { queryClient, persistence, api } = setup()
    let tail: Promise<unknown> = Promise.resolve()
    const locks = {
      request: (_name: string, run: () => Promise<unknown>) => {
        const next = tail.then(run)
        tail = next.catch(() => undefined)
        return next
      },
    } as unknown as LockManager
    const first = createAuthSession(queryClient, api, persistence, locks)
    await first.authenticate(async () => response())
    const secondClient = new QueryClient()
    const second = createAuthSession(secondClient, api, persistence, locks)
    await Promise.all([
      first.transport.refresh(first.transport.capture()),
      second.transport.refresh(second.transport.capture()),
    ])
    expect(api.refresh).toHaveBeenCalledTimes(1)
    expect(first.transport.capture().accessToken).toBe('rotated')
    expect(second.transport.capture().accessToken).toBe('rotated')
    secondClient.clear()
  })

  it('revokes tokens from authentication that completes after logout', async () => {
    const { session, api } = setup()
    const login = deferred<ReturnType<typeof response>>()
    const pending = session.authenticate(() => login.promise)
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await session.logout()
    login.resolve(response('discarded'))
    await rejected
    expect(api.logout).toHaveBeenCalledWith(response('discarded').refreshToken)
  })

  it('does not accept a refresh response for another user', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    api.refresh.mockResolvedValue(response('wrong', 'user-b'))
    await expect(session.transport.refresh(session.transport.capture())).rejects.toThrow('Сесію змінено.')
    expect(session.hasSession()).toBe(false)
  })

  it('clears memory and cache even when persistence rejects removal', async () => {
    const { session, persistence, queryClient } = setup()
    await session.authenticate(async () => response())
    queryClient.setQueryData(['private'], 'secret')
    vi.spyOn(persistence, 'removeItem').mockImplementation(() => { throw new Error('Storage unavailable') })
    await session.logout()
    expect(session.hasSession()).toBe(false)
    expect(session.transport.capture().accessToken).toBeNull()
    expect(queryClient.getQueryData(['private'])).toBeUndefined()
  })
})

describe('authenticated HTTP transport', () => {
  it('retries concurrent 401 requests once using one rotated token', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    client.configureAuth(session.transport)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) =>
      new Headers(init?.headers).get('Authorization') === 'Bearer first'
        ? new Response('', { status: 401 })
        : Response.json({ ok: true }),
    )
    try {
      expect(await Promise.all([client.get('/me'), client.get('/profile')])).toEqual([{ ok: true }, { ok: true }])
      expect(api.refresh).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledTimes(4)
    } finally { fetchMock.mockRestore() }
  })

  it('does not refresh 403, 429, or public login failures and preserves ProblemDetails', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    client.configureAuth(session.transport)
    const problem = { title: 'Forbidden', detail: 'Недостатньо прав.', instance: '/api/me', errors: { field: ['invalid'] } }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    try {
      for (const status of [403, 429, 401]) {
        fetchMock.mockResolvedValueOnce(Response.json(problem, { status, headers: { 'Retry-After': '30', 'Content-Type': 'application/problem+json' } }))
        await expect(client.post('/auth/login', { skipAuth: status === 401 })).rejects.toMatchObject({
          status, message: problem.detail, details: problem, retryAfter: '30',
        })
      }
      expect(api.refresh).not.toHaveBeenCalled()
    } finally { fetchMock.mockRestore() }
  })

  it('invalidates the session after the retry also returns 401', async () => {
    const { session } = setup()
    await session.authenticate(async () => response())
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    client.configureAuth(session.transport)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ title: 'Unauthorized' }, { status: 401 }))
    try {
      await expect(client.get('/me')).rejects.toMatchObject({ status: 401 })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(session.hasSession()).toBe(false)
    } finally { fetchMock.mockRestore() }
  })

  it('rejects a response belonging to a previous session', async () => {
    const { session } = setup()
    await session.authenticate(async () => response())
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    client.configureAuth(session.transport)
    const result = deferred<Response>()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => result.promise)
    try {
      const request = client.get('/me')
      const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' })
      await Promise.resolve()
      await session.logout()
      result.resolve(Response.json({ email: 'old@example.com' }))
      await rejected
    } finally { fetchMock.mockRestore() }
  })

  it('keeps the shared refresh alive when one waiting request is aborted', async () => {
    const { session, api } = setup()
    await session.authenticate(async () => response())
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    client.configureAuth(session.transport)
    const refresh = deferred<ReturnType<typeof response>>()
    api.refresh.mockImplementation(() => refresh.promise)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) =>
      new Headers(init?.headers).get('Authorization') === 'Bearer first'
        ? new Response(null, { status: 401 }) : Response.json({ ok: true }),
    )
    try {
      const controller = new AbortController()
      const first = client.get('/first', { signal: controller.signal })
      const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
      const second = client.get('/second')
      await vi.waitFor(() => expect(api.refresh).toHaveBeenCalledTimes(1))
      controller.abort()
      refresh.resolve(response('rotated'))
      await rejected
      await expect(second).resolves.toEqual({ ok: true })
      expect(session.hasSession()).toBe(true)
    } finally { fetchMock.mockRestore() }
  })

  it('preserves empty responses, multipart boundaries, and request cancellation', async () => {
    const client = createHttpClient({ baseUrl: 'https://example.test/api' })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(null, { status: 204 }))
    try {
      const body = new FormData()
      body.set('File', new Blob(['image']), 'image.png')
      await expect(client.post('/media/upload', { body })).resolves.toBeUndefined()
      expect(fetchMock.mock.calls[0][1]?.body).toBe(body)
      expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Content-Type')).toBe(false)
      const controller = new AbortController()
      controller.abort()
      await expect(client.get('/me', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally { fetchMock.mockRestore() }
  })
})
