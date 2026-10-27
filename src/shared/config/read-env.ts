import { readAppIdentity } from './identity'
import { readGoogleClientId, readMockUserRole, readNumericEnv } from './source-options'

type Environment = Record<string, string | boolean | undefined>

function requiredString(source: Environment, key: string): string {
  const value = source[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}. See .env.example.`)
  }
  return value.trim()
}

function readApiBaseUrl(source: Environment): string {
  const server = requiredString(source, 'VITE_PATH_TO_SERVER')
  let url: URL
  try {
    url = new URL(server)
  } catch {
    throw new Error('Invalid environment variable: VITE_PATH_TO_SERVER. Expected an absolute HTTP(S) URL.')
  }
  if (!/^https?:\/\//i.test(server) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || server.includes('?') || server.includes('#')) {
    throw new Error('Invalid environment variable: VITE_PATH_TO_SERVER. Expected an HTTP(S) URL without credentials, query, or fragment.')
  }

  const prefix = requiredString(source, 'VITE_PATH_TO_API').replace(/^\/+|\/+$/g, '')
  if (!prefix || !prefix.split('/').every(segment => /^[a-zA-Z0-9_-]+$/.test(segment))) {
    throw new Error('Invalid environment variable: VITE_PATH_TO_API. Expected an API path such as api/.')
  }
  const pathname = url.pathname.replace(/\/+$/, '')
  url.pathname = pathname.endsWith(`/${prefix}`) ? pathname : `${pathname}/${prefix}`
  return url.toString().replace(/\/+$/, '')
}

export function readEnvironment(source: Environment) {
  return Object.freeze({
    apiBaseUrl: readApiBaseUrl(source),
    ...readAppIdentity(source),
    numeric: Object.freeze(readNumericEnv(source)),
    googleClientId: readGoogleClientId(source),
    useMock: false,
    mockUserRole: readMockUserRole(source),
    enableImageUpload: source.VITE_ENABLE_IMAGE_UPLOAD !== 'false',
    enableVideoUpload: source.VITE_ENABLE_VIDEO_UPLOAD !== 'false',
    enableLinkPreviews: source.VITE_ENABLE_LINK_PREVIEWS !== 'false',
    enableGifs: source.VITE_ENABLE_GIFS !== 'false',
    enablePolls: source.VITE_ENABLE_POLLS !== 'false',
    enableLocation: source.VITE_ENABLE_LOCATION !== 'false',
  })
}
