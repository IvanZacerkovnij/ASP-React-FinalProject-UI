import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../../shared/api/domain-client'
import { runReaction } from '../reactions'
import type { Tweet } from '../../types/tweet'

const post: Tweet = {
  id: 'same', versionId: 'v1', content: 'Текст', author: { id: 'author', username: 'author', isVerified: false },
  attachments: [], likesCount: 0, retweetsCount: 0, repliesCount: 0, viewsCount: 0,
  likedByMe: false, repostedByMe: false, bookmarkedByMe: false, createdAt: '2026-10-01T00:00:00Z',
}
afterEach(() => vi.restoreAllMocks())

describe('reaction transactions', () => {
  it('coalesces repeated clicks and updates nested occurrences by target type', async () => {
    const client = new QueryClient()
    client.setQueryData(['content', 'list'], [post, { ...post, isComment: true, postId: 'root' }])
    client.setQueryData(['discovery', 'quotes'], [{ ...post, id: 'quote', quote: { target: post } }])
    let resolve!: (value: unknown) => void
    const response = new Promise(accept => { resolve = accept })
    const send = vi.spyOn(apiClient, 'post').mockReturnValue(response)
    const first = runReaction(client, { id: 'same', type: 'post', action: 'like', active: false }, () => true)
    const second = runReaction(client, { id: 'same', type: 'post', action: 'like', active: false }, () => true)
    expect(first).toBe(second)
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    const optimistic = client.getQueryData<Tweet[]>(['content', 'list'])!
    expect(optimistic[0].likedByMe).toBe(true)
    expect(optimistic[1].likedByMe).toBe(false)
    resolve({ likedByMe: true, likesCount: 5 })
    expect(await first).toBe(true)
    expect(client.getQueryData<Tweet[]>(['content', 'list'])![0].likesCount).toBe(5)
    expect(client.getQueryData<{ quote: { target: Tweet } }[]>(['discovery', 'quotes'])![0].quote.target.likesCount).toBe(5)
    client.clear()
  })

  it('rolls back optimistic changes when the server rejects a mutation', async () => {
    const client = new QueryClient()
    client.setQueryData(['content', 'list'], [post])
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Rate limited'))
    await expect(runReaction(client, { id: 'same', type: 'post', action: 'like', active: false }, () => true)).rejects.toThrow('Rate limited')
    expect(client.getQueryData<Tweet[]>(['content', 'list'])![0]).toMatchObject({ likedByMe: false, likesCount: 0 })
    client.clear()
  })

  it('ignores a prior session completion after the cache changes', async () => {
    const client = new QueryClient()
    client.setQueryData(['content', 'list'], [post])
    let resolve!: (value: unknown) => void
    vi.spyOn(apiClient, 'post').mockReturnValue(new Promise(accept => { resolve = accept }))
    let current = true
    const pending = runReaction(client, { id: 'same', type: 'post', action: 'like', active: false }, () => current)
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'))
    current = false
    client.clear()
    client.setQueryData(['content', 'list'], [post])
    resolve({ likedByMe: true, likesCount: 99 })
    expect(await pending).toBe(false)
    expect(client.getQueryData<Tweet[]>(['content', 'list'])![0].likesCount).toBe(0)
    client.clear()
  })
})
