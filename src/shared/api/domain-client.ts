import { api } from './client'
export { ApiError } from './api-error'

type Options = { signal?: AbortSignal; skipAuth?: boolean }
const route = (path: string) => path.startsWith('/') ? path : `/${path}`

export const apiClient = {
  get: <Result>(path: string, options?: Options) => api.get<Result>(route(path), options),
  post: <Result>(path: string, body?: unknown, options?: Options) => api.post<Result>(route(path), { ...options, body }),
  put: <Result>(path: string, body?: unknown, options?: Options) => api.put<Result>(route(path), { ...options, body }),
  patch: <Result>(path: string, body?: unknown, options?: Options) => api.patch<Result>(route(path), { ...options, body }),
  delete: <Result>(path: string, options?: Options) => api.delete<Result>(route(path), options),
}
