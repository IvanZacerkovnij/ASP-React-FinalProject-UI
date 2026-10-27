// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../../../../auth/model/auth-context'
import { createAuthSession } from '../../../../auth/model/session'
import { apiClient } from '../../../../../shared/api/domain-client'
import { useTweetComposer } from '../useTweetComposer'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('retains a failed submission and exposes the server message, then clears the draft only after success', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(apiClient, 'get').mockResolvedValue([])
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const session = createAuthSession(client, { refresh: vi.fn(), logout: vi.fn() }, sessionStorage)
  const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Спробуйте через 30 секунд.')).mockResolvedValueOnce(true)
  let composer!: ReturnType<typeof useTweetComposer>
  function Probe() { composer = useTweetComposer({ initialContent: 'Моя чернетка', onSubmit }); return null }
  const root = createRoot(document.createElement('div'))
  try {
    await act(async () => root.render(<QueryClientProvider client={client}><AuthContext.Provider value={{
      session, isLoading: false, error: null,
      user: { id: 'user', username: 'demo', displayName: 'Демо', email: null, avatarUrl: null, bannerUrl: null, bio: null,
        role: 'User', isVerified: false, followersCount: 0, followingCount: 0, postsCount: 0, isFollowedByCurrentUser: false, createdAt: '2026-10-01T00:00:00Z' },
    }}><Probe /></AuthContext.Provider></QueryClientProvider>))
    await act(async () => { await expect(composer.submit()).rejects.toThrow('Спробуйте через 30 секунд.') })
    expect(composer.content).toBe('Моя чернетка')
    expect(composer.errors).toContainEqual(expect.objectContaining({ message: 'Спробуйте через 30 секунд.' }))
    await act(async () => { await composer.submit() })
    expect(composer.content).toBe('')
    expect(composer.errors).toEqual([])
  } finally {
    await act(async () => root.unmount())
    client.clear()
  }
})
