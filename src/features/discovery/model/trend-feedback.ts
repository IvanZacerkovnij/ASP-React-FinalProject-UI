import { createContext, useContext } from 'react'
import type { TrendFeedbackReason } from '../types/recommendations'

export const TrendFeedbackContext = createContext<{
  hidden: Record<string, TrendFeedbackReason>
  dismiss: (trendId: string, reason: TrendFeedbackReason) => void
} | null>(null)
export function useTrendFeedback() {
  const context = useContext(TrendFeedbackContext)
  if (!context) throw new Error('TrendFeedbackProvider is required')
  return context
}
