export class ApiError extends Error {
  readonly status: number | undefined
  readonly details: unknown

  constructor(message: string, options: { status?: number; details?: unknown; cause?: unknown } = {}) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.details = options.details
  }
}

export function getErrorMessage(details: unknown, fallback: string): string {
  if (typeof details === 'string' && details.trim()) return details

  if (details && typeof details === 'object') {
    for (const key of ['detail', 'title', 'message']) {
      if (key in details) {
        const value = (details as Record<string, unknown>)[key]
        if (typeof value === 'string' && value.trim()) return value
      }
    }
  }

  return fallback
}
