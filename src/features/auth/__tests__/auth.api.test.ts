import { afterEach, expect, it, vi } from 'vitest'
import { authApi } from '../api/auth.api'

vi.mock('../../../shared/api/client', async () => {
  const { createHttpClient } = await import('../../../shared/api/http-client')
  return { api: createHttpClient({ baseUrl: 'https://example.test/api' }) }
})

afterEach(() => vi.restoreAllMocks())

it('keeps registration as a message response and verification as a token response', async () => {
  const message = { message: 'Verification code has been sent to your email.' }
  const tokens = { userId: 'user', username: 'ivan.z', accessToken: 'access', refreshToken: 'x'.repeat(44), accessTokenExpiresAt: '2099-01-01T00:00:00Z' }
  const fetchMock = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json(message))
    .mockResolvedValueOnce(Response.json(tokens))
  await expect(authApi.register({ username: 'ivan.z', email: 'ivan@example.com', password: 'password', displayName: 'Іван' })).resolves.toEqual(message)
  await expect(authApi.verifyEmail({ email: 'ivan@example.com', code: '012345' })).resolves.toEqual(tokens)
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['https://example.test/api/auth/register', 'https://example.test/api/auth/verify-email'])
  expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string)).toEqual({ email: 'ivan@example.com', code: '012345' })
})

it('uses JSON refresh/logout tokens and accepts 204 without inventing an envelope', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(Response.json({ accessToken: 'rotated' }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  await expect(authApi.refresh('x'.repeat(44))).resolves.toEqual({ accessToken: 'rotated' })
  await expect(authApi.logout('x'.repeat(44))).resolves.toBeUndefined()
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['https://example.test/api/auth/refresh', 'https://example.test/api/auth/logout'])
  for (const [, init] of fetchMock.mock.calls) {
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({ refreshToken: 'x'.repeat(44) })
    expect(new Headers(init?.headers).has('Authorization')).toBe(false)
  }
})

it('uses the canonical password-change endpoints and recovery DTOs', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ message: 'ok' }))
  await authApi.forgotPassword({ email: 'ivan@example.com' })
  await authApi.verifyResetCode({ email: 'ivan@example.com', code: '012345' })
  await authApi.resetPassword({ email: 'ivan@example.com', code: '012345', newPassword: 'new-password' })
  await authApi.startPasswordChange({ currentPassword: 'password', newPassword: 'new-password' })
  await authApi.confirmPasswordChange({ code: '012345' })
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    'https://example.test/api/auth/forgot-password', 'https://example.test/api/auth/verify-reset-code',
    'https://example.test/api/auth/reset-password', 'https://example.test/api/me/change-password/start',
    'https://example.test/api/me/change-password/confirm',
  ])
  expect(JSON.parse(fetchMock.mock.calls[2][1]!.body as string)).toEqual({ email: 'ivan@example.com', code: '012345', newPassword: 'new-password' })
})
