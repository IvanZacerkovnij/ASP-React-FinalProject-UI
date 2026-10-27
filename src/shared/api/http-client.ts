import { ApiError, getErrorMessage } from './api-error'

type HttpClientOptions = {
  baseUrl?: string
  credentials?: RequestCredentials
  getHeaders?: () => HeadersInit | Promise<HeadersInit>
}

export interface TransportSession {
  id: string
  accessToken: string | null
}

export interface AuthTransport {
  capture: () => TransportSession
  isCurrent: (session: TransportSession) => boolean
  refresh: (session: TransportSession) => Promise<void>
  unauthorized: (session: TransportSession) => void
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown
  skipAuth?: boolean
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('json') ? JSON.parse(text) : text
}

export function createHttpClient(options: HttpClientOptions) {
  let authentication: AuthTransport | undefined
  async function request<ResponseData = unknown>(
    method: string,
    path: string,
    { body, headers: requestHeaders, skipAuth = false, ...init }: RequestOptions = {},
  ): Promise<ResponseData> {
    const auth = skipAuth ? undefined : authentication
    const session = auth?.capture()
    const assertCurrent = () => {
      init.signal?.throwIfAborted()
      if (session && !auth?.isCurrent(session)) throw new DOMException('Сесію змінено.', 'AbortError')
    }
    try {
      if (!options.baseUrl) throw new ApiError('Сервер API не налаштовано.')
      if (!path.startsWith('/') || path.startsWith('//')) {
        throw new ApiError('API paths must start with a single slash.')
      }

      const headers = new Headers(await options.getHeaders?.())
      new Headers(requestHeaders).forEach((value, key) => headers.set(key, value))
      if (!headers.has('Accept')) headers.set('Accept', 'application/json')
      const isFormData = body instanceof FormData
      if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const send = () => {
        assertCurrent()
        const token = auth?.capture().accessToken
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(`${options.baseUrl!.replace(/\/+$/, '')}${path}`, {
          credentials: options.credentials,
          ...init,
          method,
          headers,
          body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
        })
      }
      let response = await send()
      assertCurrent()
      if (response.status === 401 && session?.accessToken && auth) {
        await auth.refresh(session)
        assertCurrent()
        response = await send()
      }
      let details: unknown
      try {
        details = await readResponse(response)
      } catch (cause) {
        if (init.signal?.aborted) throw cause
        throw new ApiError('Сервер повернув некоректну відповідь.', { status: response.status, cause })
      }

      assertCurrent()
      if (!response.ok) {
        if (response.status === 401 && session?.accessToken) auth?.unauthorized(session)
        throw new ApiError(getErrorMessage(details, `Не вдалося виконати запит (${response.status}).`), {
          status: response.status,
          details,
          retryAfter: response.headers.get('Retry-After'),
        })
      }

      return details as ResponseData
    } catch (cause) {
      if (init.signal?.aborted || (cause instanceof Error && cause.name === 'AbortError')) throw cause
      if (cause instanceof ApiError) throw cause
      throw new ApiError('Не вдалося виконати запит. Перевірте з’єднання.', { cause })
    }
  }

  return {
    getSessionId: () => authentication?.capture().id,
    configureAuth: (auth: AuthTransport) => {
      authentication = auth
      return () => { if (authentication === auth) authentication = undefined }
    },
    get: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('GET', path, init),
    post: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('POST', path, init),
    put: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('PUT', path, init),
    patch: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('PATCH', path, init),
    delete: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('DELETE', path, init),
  }
}
