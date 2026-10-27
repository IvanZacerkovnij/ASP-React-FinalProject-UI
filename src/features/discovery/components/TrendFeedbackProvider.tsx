import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { useAuth } from '../../auth'
import { TrendFeedbackContext } from '../model/trend-feedback'
import type { TrendFeedbackReason } from '../types/recommendations'

function SessionFeedback({ children }: PropsWithChildren) {
  const [hidden, setHidden] = useState<Record<string, TrendFeedbackReason>>({})
  const dismiss = useCallback((trendId: string, reason: TrendFeedbackReason) =>
    setHidden(previous => ({ ...previous, [trendId]: reason })), [])
  const value = useMemo(() => ({ hidden, dismiss }), [hidden, dismiss])
  return <TrendFeedbackContext.Provider value={value}>{children}</TrendFeedbackContext.Provider>
}
export function TrendFeedbackProvider({ children }: PropsWithChildren) {
  const { sessionKey } = useAuth()
  return <SessionFeedback key={sessionKey}>{children}</SessionFeedback>
}
