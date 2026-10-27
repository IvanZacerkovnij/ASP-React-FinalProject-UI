import { useInfiniteQuery, useQuery, skipToken } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/domain-client'
import { ENDPOINTS } from '../../../shared/api/endpoints'
import { errorMessage, useServerMutation } from '../../../shared/api/query-helpers'
import type { CursorPage } from '../../../shared/types/api'
import { tweetApi } from './tweet.api'
import { commentApi } from './comment.api'
import { pollApi } from './poll.api'
import { getMappedPostPage, getMappedInteractionPage, mapPostToTweet, mapEditHistoryResponse, type BackendPost, type BackendEditHistoryResponse } from './mappers/post.mapper'
import type { PostsQuery, Target } from '../model/types'
import type { Tweet, CreateTweetRequest, CreateCommentRequest, UpdateTweetRequest, UpdateCommentRequest, ThreadResponse } from '../types/tweet'

export { errorMessage }
export { targetOf, targetKey, reactionKey } from '../model/types'
export type { ProfileTab, PostsQuery, Target, Reaction } from '../model/types'

export function pagePath(path: string, cursor: string | null) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
}

function searchParams(criteria: Extract<PostsQuery, { kind: 'search' }>['criteria']) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(criteria)) {
    if (key === 'type' || value === undefined || value === '' || value === false || value === 'anyone' || value === 'anywhere') continue
    params.set(key === 'query' ? 'q' : key, String(value))
  }
  return params
}

async function readPosts(arg: PostsQuery, cursor: string | null, signal: AbortSignal): Promise<CursorPage<Tweet>> {
  switch (arg.kind) {
    case 'feed': {
      const items = await apiClient.get<BackendPost[]>(ENDPOINTS.posts.feed, { signal })
      return { items: items.map(mapPostToTweet), hasMore: false, nextCursor: null }
    }
    case 'bookmarks': return getMappedInteractionPage(pagePath(ENDPOINTS.posts.bookmarked, cursor), signal)
    case 'comments': {
      const page = await getMappedPostPage(pagePath(ENDPOINTS.comments.byPost(arg.postId), cursor), signal)
      return { ...page, items: page.items.map(item => ({ ...item, isComment: true })) }
    }
    case 'profile': {
      const route = pagePath(ENDPOINTS.users[arg.tab](arg.username), cursor)
      return arg.tab === 'likes' || arg.tab === 'reposts' ? getMappedInteractionPage(route, signal) : getMappedPostPage(route, signal)
    }
    case 'search': return getMappedPostPage(pagePath(`${ENDPOINTS.search.posts}?${searchParams(arg.criteria)}`, cursor), signal)
  }
}

export function useGetPostsQuery(arg: PostsQuery | typeof skipToken, options?: { skip?: boolean }) {
  const enabled = arg !== skipToken && !options?.skip
  const query = useInfiniteQuery({
    queryKey: ['content', 'list', arg === skipToken ? null : arg],
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => arg === skipToken ? Promise.reject(new Error('Запит не вибрано.')) : readPosts(arg, pageParam, signal),
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  const items = query.data?.pages.flatMap(page => page.items)
  const data = items?.filter((item, index) => items.findIndex(other => other.id === item.id && Boolean(other.isComment) === Boolean(item.isComment)) === index)
  return { ...query, data, currentData: enabled ? data : undefined, hasMore: query.hasNextPage, loadMore: query.fetchNextPage }
}

export function useGetThreadQuery(id: string | typeof skipToken) {
  const query = useInfiniteQuery({
    queryKey: ['content', 'thread', id === skipToken ? null : id],
    enabled: id !== skipToken,
    initialPageParam: null as string | null,
    queryFn: ({ signal, pageParam }) => commentApi.getThread(String(id), pageParam, signal),
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  const first = query.data?.pages[0]
  const data: ThreadResponse | undefined = first ? { ...first, replies: query.data!.pages.flatMap(page => page.replies) } : undefined
  return { ...query, data, currentData: data, hasMore: query.hasNextPage, loadMore: query.fetchNextPage }
}

export function useGetHistoryQuery(target: Target, options?: { skip?: boolean }) {
  const query = useInfiniteQuery({
    queryKey: ['content', 'history', target],
    enabled: !options?.skip,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.get<BackendEditHistoryResponse>(pagePath(ENDPOINTS[target.type === 'post' ? 'posts' : 'comments'].editHistory(target.id), pageParam), { signal })
      return { ...mapEditHistoryResponse(response), nextCursor: response.nextCursor, hasMore: response.hasMore }
    },
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  const first = query.data?.pages[0]
  const data = first ? { ...first, versions: query.data!.pages.flatMap(page => page.versions) } : undefined
  return { ...query, data, currentData: data, hasMore: query.hasNextPage, loadMore: query.fetchNextPage }
}

export function useGetPollStateQuery(target: Target, options?: { skip?: boolean; refetchOnMountOrArgChange?: boolean | number }) {
  const query = useQuery({ queryKey: ['content', 'poll', target], enabled: !options?.skip,
    queryFn: ({ signal }) => pollApi.get(target.type, target.id, signal) })
  return { ...query, currentData: query.data }
}

const changed = ['content', 'profiles', 'discovery']
export const useCreatePostMutation = () => useServerMutation((input: CreateTweetRequest) => tweetApi.create(input), changed)
export const useCreateCommentMutation = () => useServerMutation((input: CreateCommentRequest) => commentApi.create(input), changed)
export const useUpdatePostMutation = () => useServerMutation(
  (input: Target & { data: UpdateTweetRequest | UpdateCommentRequest }) => input.type === 'post'
    ? tweetApi.update(input.id, input.data) : commentApi.update(input.id, input.data as UpdateCommentRequest), changed)
export const useDeletePostMutation = () => useServerMutation((target: Target) =>
  (target.type === 'post' ? tweetApi : commentApi).delete(target.id), changed)
export function useViewPostMutation(options?: { fixedCacheKey?: string }) {
  void options
  return useServerMutation((id: string) => tweetApi.view(id), ['content'])
}
export const useViewTargetMutation = () => useServerMutation((target: Target) =>
  (target.type === 'post' ? tweetApi : commentApi).view(target.id), ['content'])
