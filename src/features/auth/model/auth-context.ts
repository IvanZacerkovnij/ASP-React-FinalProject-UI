import { createContext } from 'react'
import type { AuthSession } from './session'
import type { SessionUser } from '../types/session'

export const AuthContext = createContext<{
  session: AuthSession
  user: SessionUser | null
  isLoading: boolean
  error: Error | null
} | null>(null)
