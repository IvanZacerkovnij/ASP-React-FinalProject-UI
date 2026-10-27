import { useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/api/client'
import { AuthContext } from '../model/auth-context'
import { createAuthSession, SESSION_STORAGE_KEY } from '../model/session'
import { authApi } from '../api/auth.api'

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [session] = useState(() => createAuthSession(
    queryClient, authApi, navigator.locks ? localStorage : sessionStorage, navigator.locks,
  ))
  const sessionId = useSyncExternalStore(session.subscribe, session.getSnapshot)

  useEffect(() => {
    const disconnect = api.configureAuth(session.transport)
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY || event.key === null) session.synchronize()
    }
    window.addEventListener('storage', onStorage)
    return () => { disconnect(); window.removeEventListener('storage', onStorage) }
  }, [session])

  const currentUser = useQuery({
    queryKey: ['auth', sessionId, 'me'],
    enabled: session.hasSession(),
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      try {
        await session.restore()
        signal.throwIfAborted()
        const user = await authApi.me(signal)
        if (!session.transport.isCurrent({ id: sessionId, accessToken: null })) throw new DOMException('Сесію змінено.', 'AbortError')
        session.verifyUser(user.id)
        return user
      } catch (error) {
        if (!signal.aborted && session.getSnapshot() === sessionId) session.clear(error)
        throw error
      }
    },
  })

  return <AuthContext.Provider value={{
    session, user: session.hasSession() ? currentUser.data ?? null : null,
    isLoading: session.hasSession() && currentUser.isPending,
    error: session.getError() ?? currentUser.error,
  }}>{children}</AuthContext.Provider>
}
