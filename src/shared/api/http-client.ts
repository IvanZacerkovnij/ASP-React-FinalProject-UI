import { ApiError, getErrorMessage } from './api-error'

type HttpClientOptions = {
  baseUrl?: string
  credentials?: RequestCredentials
  getHeaders?: () => HeadersInit | Promise<HeadersInit>
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('json') ? JSON.parse(text) : text
}

export function createHttpClient(options: HttpClientOptions) {
  async function request<ResponseData = unknown>(
    method: string,
    path: string,
    { body, headers: requestHeaders, ...init }: RequestOptions = {},
  ): Promise<ResponseData> {
    try {
      if (!options.baseUrl) throw new ApiError('VITE_API_BASE_URL is not configured.')
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

      const response = await fetch(`${options.baseUrl.replace(/\/+$/, '')}${path}`, {
        credentials: options.credentials,
        ...init,
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      })
      let details: unknown
      try {
        details = await readResponse(response)
      } catch (cause) {
        if (init.signal?.aborted) throw cause
        throw new ApiError('The API returned an invalid response.', { status: response.status, cause })
      }

      if (!response.ok) {
        throw new ApiError(getErrorMessage(details, `Request failed (${response.status}).`), {
          status: response.status,
          details,
        })
      }

      return details as ResponseData
    } catch (cause) {
      if (init.signal?.aborted || (cause instanceof Error && cause.name === 'AbortError')) throw cause
      if (cause instanceof ApiError) throw cause
      throw new ApiError('Unable to complete the API request.', { cause })
    }
  }

  return {
    get: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('GET', path, init),
    post: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('POST', path, init),
    put: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('PUT', path, init),
    patch: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('PATCH', path, init),
    delete: <ResponseData = unknown>(path: string, init?: RequestOptions) => request<ResponseData>('DELETE', path, init),
  }
}
