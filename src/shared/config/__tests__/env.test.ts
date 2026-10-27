import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../api/client'
import { readEnvironment } from '../read-env'

const required = {
  VITE_PATH_TO_SERVER: 'https://localhost:7001/',
  VITE_PATH_TO_API: 'api/',
}

afterEach(() => vi.unstubAllGlobals())

describe('centralized environment configuration', () => {
  it.each([
    ['https://localhost:7001/', 'api/', 'https://localhost:7001/api'],
    ['https://backend.example.test', '/api/', 'https://backend.example.test/api'],
    ['https://backend.example.test/api///', '/api/', 'https://backend.example.test/api'],
    ['https://backend.example.test/service/', 'api/v1/', 'https://backend.example.test/service/api/v1'],
    ['https://backend.example.test/service/api/', 'api/', 'https://backend.example.test/service/api'],
    ['http://localhost:5000/', 'api/', 'http://localhost:5000/api'],
  ])('combines %s and %s into %s', (server, prefix, expected) => {
    expect(readEnvironment({ VITE_PATH_TO_SERVER: server, VITE_PATH_TO_API: prefix }).apiBaseUrl)
      .toBe(expected)
  })

  it.each(['VITE_PATH_TO_SERVER', 'VITE_PATH_TO_API'])('requires %s', key => {
    for (const value of [undefined, '', '   ']) {
      expect(() => readEnvironment({ ...required, [key]: value }))
        .toThrow(`Missing required environment variable: ${key}`)
    }
  })

  it.each(['localhost:7001', '/api', 'ftp://backend.test', 'https:backend.test', 'https://user:password@backend.test', 'https://backend.test/?token=secret', 'https://backend.test/#fragment', 'https://backend.test/?', 'https://backend.test/#'])('rejects an invalid server URL without disclosing it', server => {
    expect(() => readEnvironment({ ...required, VITE_PATH_TO_SERVER: server }))
      .toThrow(/^Invalid environment variable: VITE_PATH_TO_SERVER\./)
    try {
      readEnvironment({ ...required, VITE_PATH_TO_SERVER: server })
    } catch (error) {
      expect((error as Error).message).not.toContain(server)
    }
  })

  it.each(['/', '../api', 'api//v1', 'https://backend.test/api', 'api?token=secret', 'api#fragment'])('rejects an invalid API prefix', prefix => {
    expect(() => readEnvironment({ ...required, VITE_PATH_TO_API: prefix }))
      .toThrow('Invalid environment variable: VITE_PATH_TO_API')
  })

  it('retains identity, numeric, optional auth, and feature defaults', () => {
    const result = readEnvironment(required)
    expect(result).toMatchObject({
      name: 'Chirp', locale: 'uk-UA', googleClientId: '', useMock: false,
      mockUserRole: 'User', enableImageUpload: true, enableVideoUpload: true,
      enableLinkPreviews: true, enableGifs: true, enablePolls: true, enableLocation: true,
      numeric: { VITE_MAX_TWEET_LENGTH: 280, VITE_IMAGE_QUALITY: 0.8 },
    })
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.numeric)).toBe(true)
  })

  it('preserves feature flags and keeps mock mode disabled even when requested', () => {
    expect(readEnvironment({
      ...required, VITE_ENABLE_IMAGE_UPLOAD: 'false', VITE_ENABLE_VIDEO_UPLOAD: 'false',
      VITE_ENABLE_LINK_PREVIEWS: 'false', VITE_ENABLE_GIFS: 'false',
      VITE_ENABLE_POLLS: 'false', VITE_ENABLE_LOCATION: 'false',
      VITE_USE_MOCK: 'true', VITE_MOCK_USER_ROLE: 'ADMIN', VITE_GOOGLE_CLIENT_ID: ' public-client-id ',
    })).toMatchObject({
      enableImageUpload: false, enableVideoUpload: false, enableLinkPreviews: false,
      enableGifs: false, enablePolls: false, enableLocation: false,
      useMock: false, mockUserRole: 'Admin', googleClientId: 'public-client-id',
    })
    for (const value of ['', 'FALSE', '0', 'true']) {
      expect(readEnvironment({ ...required, VITE_ENABLE_POLLS: value }).enablePolls).toBe(true)
    }
  })

  it.each(['', '0', '-1', 'NaN', 'Infinity', '1.5'])('rejects invalid integer limits: %s', value => {
    expect(() => readEnvironment({ ...required, VITE_MAX_TWEET_LENGTH: value }))
      .toThrow('Invalid environment variable: VITE_MAX_TWEET_LENGTH')
  })

  it('rejects invalid compression quality and mock roles', () => {
    expect(() => readEnvironment({ ...required, VITE_IMAGE_QUALITY: '1.1' }))
      .toThrow('Invalid environment variable: VITE_IMAGE_QUALITY')
    expect(() => readEnvironment({ ...required, VITE_MOCK_USER_ROLE: 'admin' }))
      .toThrow('Invalid environment variable: VITE_MOCK_USER_ROLE')
  })

  it('does not copy unknown environment values into configuration', () => {
    expect(readEnvironment({ ...required, DATABASE_PASSWORD: 'test-only-canary', VITE_UNKNOWN: 'test-only-canary' }))
      .not.toHaveProperty('DATABASE_PASSWORD')
    expect(JSON.stringify(readEnvironment({ ...required, VITE_UNKNOWN: 'test-only-canary' })))
      .not.toContain('test-only-canary')
  })

  it('wires the configured API base URL into the application HTTP client', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    await api.get('/auth/login', { skipAuth: true })
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/api/auth/login')
  })
})
