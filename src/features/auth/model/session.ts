import { z } from 'zod'
import type { QueryClient } from '@tanstack/react-query'
import type { AuthTransport, TransportSession } from '../../../shared/api/http-client'
import { ApiError } from '../../../shared/api/api-error'
import type { AuthResponse } from '../types/auth'
import type { SessionUser, StoredSession } from '../types/session'

export const SESSION_STORAGE_KEY = 'chirp.auth.session.v1'
const tokenSchema = z.object({
  userId: z.string().min(1), username: z.string().min(1),
  accessToken: z.string().min(1), refreshToken: z.string().length(44),
  accessTokenExpiresAt: z.iso.datetime({ offset: true }),
})
const storedSchema = tokenSchema.extend({ sessionId: z.string().min(1) })

export interface SessionApi {
  refresh: (token: string) => Promise<AuthResponse>
  logout: (token: string) => Promise<void>
}

export function createAuthSession(queryClient: QueryClient, api: SessionApi, storage: Storage, locks?: LockManager) {
  const listeners = new Set<() => void>()
  const invalidated = new Set<string>()
  let record: StoredSession | null = read()
  let anonymousId = crypto.randomUUID()
  let pending: { id: string; promise: Promise<void> } | undefined
  let authenticationAttempt = 0
  let lastError: Error | null = null

  function read(): StoredSession | null {
    try {
      const value = storage.getItem(SESSION_STORAGE_KEY)
      if (!value) return null
      const result = storedSchema.safeParse(JSON.parse(value))
      if (result.success && !invalidated.has(result.data.sessionId)) return result.data
      storage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      try { storage.removeItem(SESSION_STORAGE_KEY) } catch { return null }
    }
    return null
  }

  function clearCache() {
    void queryClient.cancelQueries()
    queryClient.clear()
  }

  function notify() { listeners.forEach(listener => listener()) }

  function synchronize() {
    const next = read()
    if (next?.sessionId !== record?.sessionId) {
      authenticationAttempt += 1
      anonymousId = crypto.randomUUID()
      record = next
      lastError = null
      clearCache()
      notify()
    } else record = next
  }

  function id() { return record?.sessionId ?? anonymousId }

  function assertCurrent(expected: string) {
    synchronize()
    if (expected !== id()) throw new DOMException('Сесію змінено.', 'AbortError')
  }

  function clear(reason?: unknown) {
    authenticationAttempt += 1
    lastError = reason instanceof Error ? reason : null
    if (record) invalidated.add(record.sessionId)
    try { storage.removeItem(SESSION_STORAGE_KEY) } catch { record = null }
    record = null
    anonymousId = crypto.randomUUID()
    clearCache()
    notify()
  }

  async function exclusive<Result>(run: () => Promise<Result>): Promise<Result> {
    return locks ? locks.request(SESSION_STORAGE_KEY, run) : run()
  }

  const transport: AuthTransport = {
    unauthorized: snapshot => { if (transport.isCurrent(snapshot)) clear(new ApiError('Сесію завершено. Увійдіть знову.')) },
    capture: () => {
      synchronize()
      return { id: id(), accessToken: record?.accessToken ?? null }
    },
    isCurrent: (snapshot) => {
      synchronize()
      return snapshot.id === id()
    },
    refresh: (snapshot: TransportSession) => {
      assertCurrent(snapshot.id)
      if (record?.accessToken !== snapshot.accessToken) return Promise.resolve()
      if (pending?.id === snapshot.id) return pending.promise
      const promise = exclusive(async () => {
        assertCurrent(snapshot.id)
        if (!record || record.accessToken !== snapshot.accessToken) return
        const previous = record
        try {
          const response = tokenSchema.parse(await api.refresh(previous.refreshToken))
          if (response.userId !== previous.userId) throw new ApiError('Сесію змінено.')
          try { assertCurrent(snapshot.id) } catch (error) {
            await api.logout(response.refreshToken).catch(() => undefined)
            throw error
          }
          record = { ...response, sessionId: previous.sessionId }
          storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(record))
        } catch (error) {
          if (transport.isCurrent(snapshot)) clear(new ApiError('Не вдалося оновити сесію. Увійдіть знову.', { cause: error }))
          throw error
        }
      }).finally(() => { if (pending?.promise === promise) pending = undefined })
      pending = { id: snapshot.id, promise }
      return promise
    },
  }

  return {
    transport,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    getSnapshot: () => id(),
    getError: () => lastError,
    updateUser: (updated: Partial<SessionUser> & { id: string }, expected: string) => {
      assertCurrent(expected)
      if (updated.id !== record?.userId) return
      queryClient.setQueryData<SessionUser>(['auth', expected, 'me'], previous => previous ? { ...previous, ...updated } : previous)
      void Promise.all(['content', 'profiles', 'discovery'].map(domain => queryClient.invalidateQueries({ queryKey: [domain] })))
    },
    hasSession: () => Boolean(record),
    verifyUser: (userId: string) => {
      if (!record || userId !== record.userId) throw new ApiError('Не вдалося підтвердити власника сесії.')
    },
    synchronize,
    clear,
    async restore() {
      synchronize()
      if (record && Date.parse(record.accessTokenExpiresAt) <= Date.now()) await transport.refresh(transport.capture())
    },
    async authenticate(run: () => Promise<AuthResponse>, signal?: AbortSignal) {
      const expected = transport.capture().id
      const attempt = ++authenticationAttempt
      const response = tokenSchema.parse(await run())
      try {
        signal?.throwIfAborted()
        assertCurrent(expected)
        if (attempt !== authenticationAttempt) throw new DOMException('Сесію змінено.', 'AbortError')
        await exclusive(async () => {
          signal?.throwIfAborted()
          assertCurrent(expected)
          if (attempt !== authenticationAttempt) throw new DOMException('Сесію змінено.', 'AbortError')
          const next = { ...response, sessionId: crypto.randomUUID() }
          storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next))
          record = next
          lastError = null
          clearCache()
          notify()
        })
      } catch (error) {
        await api.logout(response.refreshToken).catch(() => undefined)
        throw error
      }
    },
    async logout() {
      synchronize()
      const previous = record
      clear()
      const endedId = id()
      try {
        await exclusive(async () => {
          if (previous) {
            try { await api.logout(previous.refreshToken) } catch (error) {
              if (!(error instanceof ApiError && error.status === 401)) throw error
            }
          }
        })
      } catch (error) {
        if (id() === endedId) {
          lastError = new ApiError('Не вдалося відкликати сесію на сервері. Ви вийшли з акаунта.', { cause: error })
          anonymousId = crypto.randomUUID()
          notify()
        }
        throw error
      }
    },
  }
}

export type AuthSession = ReturnType<typeof createAuthSession>
