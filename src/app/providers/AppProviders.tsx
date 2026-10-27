import { useEffect, useState, type PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './query-client'
import { AuthProvider } from '../../features/auth/components/AuthProvider'
import { watchTheme } from '../../features/preferences/hooks/useTheme'
import { TrendFeedbackProvider } from '../../features/discovery'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)
  useEffect(watchTheme, [])

  return <QueryClientProvider client={queryClient}><AuthProvider><TrendFeedbackProvider>{children}</TrendFeedbackProvider></AuthProvider></QueryClientProvider>
}
