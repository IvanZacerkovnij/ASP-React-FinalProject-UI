// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../../shared/api/domain-client'
import { ApiError } from '../../../../shared/api/api-error'
import { useGetPostsQuery, useGetThreadQuery, useGetHistoryQuery } from '../queries'
import type { BackendPost } from '../mappers/post.mapper'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
let client: QueryClient
const post: BackendPost = {
  id: 'same-id', versionId: 'v1', content: 'Допис', author: { id: 'author', username: 'author', isVerified: false },
  likesCount: 1, repostsCount: 0, viewsCount: 0, isLikedByCurrentUser: false, createdAt: '2026-10-01T00:00:00Z',
}
afterEach(async () => {
  await act(async () => root?.unmount())
  client?.clear()
  vi.restoreAllMocks()
})

async function mount(children: React.ReactNode) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  root = createRoot(document.createElement('div'))
  await act(async () => { root!.render(<QueryClientProvider client={client}>{children}</QueryClientProvider>) })
}
async function settle(check: () => void) {
  await act(async () => { await vi.waitFor(check) })
}

describe('cursor query integration', () => {
  it('keeps opaque cursors and distinguishes post and comment IDs in mixed bookmarks', async () => {
    const cursor = 'opaque+/=?&ю'
    const get = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      posts: [post], comments: [], nextCursor: cursor, hasMore: true,
    }).mockResolvedValueOnce({
      posts: [], comments: [{ ...post, postId: 'root', content: 'Відповідь' }], nextCursor: null, hasMore: false,
    })
    let query!: ReturnType<typeof useGetPostsQuery>
    function Read() { query = useGetPostsQuery({ kind: 'bookmarks' }); return null }
    await mount(<Read />)
    await settle(() => expect(query.data).toHaveLength(1))
    await act(async () => { await query.loadMore() })
    await settle(() => expect(query.data).toHaveLength(2))
    const path = String(get.mock.calls[1][0])
    expect(new URL(path, 'https://example.test').searchParams.get('cursor')).toBe(cursor)
    expect(get.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(query.data!.map(item => Boolean(item.isComment))).toEqual([false, true])
    expect(query.hasMore).toBe(false)
  })

  it('retains comment thread context and loads the next reply page', async () => {
    const comment = { ...post, id: 'child', postId: 'root', parentCommentId: 'parent' }
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
      if (path === 'posts/parent') throw new ApiError('Not found', { status: 404 })
      const cursor = new URL(String(path), 'https://example.test').searchParams.get('cursor')
      return { post: { ...post, id: 'root' }, ancestors: [], target: { ...post, id: 'parent', postId: 'root' },
        replies: { items: [cursor ? { ...comment, id: 'child-2' } : comment], nextCursor: cursor ? null : 'next', hasMore: !cursor } }
    })
    let query!: ReturnType<typeof useGetThreadQuery>
    function Read() { query = useGetThreadQuery('parent'); return null }
    await mount(<Read />)
    await settle(() => expect(query.data?.replies).toHaveLength(1))
    expect(query.data?.ancestors[0].id).toBe('root')
    expect(query.data?.target.isComment).toBe(true)
    await act(async () => { await query.loadMore() })
    await settle(() => expect(query.data?.replies).toHaveLength(2))
    expect(get.mock.calls.some(([path]) => String(path).includes('cursor=next'))).toBe(true)
  })

  it('retains edit history pagination instead of silently losing older versions', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      targetId: 'same-id', targetType: 'post', versions: [post], nextCursor: 'older', hasMore: true,
    }).mockResolvedValueOnce({
      targetId: 'same-id', targetType: 'post', versions: [{ ...post, versionId: 'v2' }], nextCursor: null, hasMore: false,
    })
    let query!: ReturnType<typeof useGetHistoryQuery>
    function Read() { query = useGetHistoryQuery({ id: 'same-id', type: 'post' }); return null }
    await mount(<Read />)
    await settle(() => expect(query.data?.versions).toHaveLength(1))
    expect(query.hasMore).toBe(true)
    await act(async () => { await query.loadMore() })
    await settle(() => expect(query.data?.versions).toHaveLength(2))
    expect(query.hasMore).toBe(false)
  })
})
