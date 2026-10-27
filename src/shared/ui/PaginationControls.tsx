import { Button } from './Button'
import { errorMessage } from '../api/query-helpers'

export interface PaginationControlsProps {
  hasMore?: boolean
  isFetching?: boolean
  error?: unknown
  onLoadMore: () => unknown
  onRetry?: () => unknown
}

export function PaginationControls({ hasMore, isFetching, error, onLoadMore, onRetry }: PaginationControlsProps) {
  if (!hasMore && !error) return null
  return <div className="flex flex-col items-center gap-3 border-t border-border p-4" aria-live="polite">
    {error ? <p role="alert" className="text-sm text-destructive">{errorMessage(error)}</p> : null}
    <Button type="button" variant="outline" disabled={isFetching} onClick={() => { void (error && onRetry ? onRetry() : onLoadMore()) }}>
      {isFetching ? 'Завантаження…' : error ? 'Спробувати ще раз' : 'Показати більше'}
    </Button>
  </div>
}
