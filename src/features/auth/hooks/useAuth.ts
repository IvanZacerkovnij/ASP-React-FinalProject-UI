import { useCallback, useContext } from 'react'
import { AuthContext } from '../model/auth-context'
import { authApi } from '../api/auth.api'
import type { GoogleLoginRequest, LoginRequest, VerifyEmailRequest } from '../types/auth'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is required')
  const { session, user, isLoading, error } = context
  const sessionId = session.getSnapshot()
  const captureSession = useCallback(() => {
    const expected = session.getSnapshot()
    return () => session.getSnapshot() === expected
  }, [session])
  const updateUser = useCallback((updated: import('../../profiles').User) => {
    if (session.getSnapshot() !== sessionId || updated.id !== user?.id) return
    session.updateUser(updated, sessionId)
  }, [session, sessionId, user?.id])
  const login = useCallback((body: LoginRequest) => session.authenticate(() => authApi.login(body)), [session])
  const verifyEmail = useCallback((body: VerifyEmailRequest) => session.authenticate(() => authApi.verifyEmail(body)), [session])
  const loginWithGoogle = useCallback((body: GoogleLoginRequest, signal?: AbortSignal) => session.authenticate(() => authApi.loginWithGoogle(body, signal), signal), [session])
  const logout = useCallback(() => session.logout(), [session])
  return { user, isLoading, error, isAuthenticated: Boolean(user), login, register: authApi.register,
    verifyEmail, loginWithGoogle, linkGoogle: authApi.linkGoogle, logout, updateUser, captureSession, sessionKey: sessionId }
}
