import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../../shared/api/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status !== undefined && error.status < 500) {
            return false
          }

          return failureCount < 2
        },
      },
      mutations: { retry: false },
    },
  })
}
