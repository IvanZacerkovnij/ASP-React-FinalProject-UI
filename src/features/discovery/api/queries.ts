import { useInfiniteQuery, useQuery, skipToken } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/domain-client'
import { ENDPOINTS } from '../../../shared/api/endpoints'
import { mapPostToTweet, type BackendPost } from "../../content/mapping";
import { mapUserRole, type BackendUser } from "../../profiles/mapping";
import { serializeSearchApiCriteria } from '../lib/search'
import type { CursorPage } from '../../../shared/types/api'
import { type UserShort } from "../../profiles/index";
import type { SearchCriteria, SearchViewerContext } from '../types/search'
import type { TrendRecommendationsResponse } from '../types/recommendations'

export function useGetRecommendedPostsInfiniteQuery(limit: number) {
  const query = useInfiniteQuery({
    queryKey: ['discovery', 'posts', limit], initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam) params.set('cursor', pageParam)
      const page = await apiClient.get<CursorPage<BackendPost>>(`${ENDPOINTS.recommendations.posts}?${params}`, { signal })
      return { ...page, items: page.items.map(mapPostToTweet) }
    },
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  return { ...query, direction: query.isFetchNextPageError ? 'forward' : undefined }
}
export function useGetRecommendedUsersInfiniteQuery(limit: number) {
  return useInfiniteQuery({
    queryKey: ['discovery', 'users', limit], initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam) params.set('cursor', pageParam)
      const page = await apiClient.get<CursorPage<BackendUser<UserShort>>>(`${ENDPOINTS.recommendations.users}?${params}`, { signal })
      return { ...page, items: page.items.map(mapUserRole) }
    },
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
}
export function useGetTrendsQuery(limit: number) {
  return useQuery({ queryKey: ['discovery', 'trends', limit],
    queryFn: ({ signal }) => apiClient.get<TrendRecommendationsResponse>(`${ENDPOINTS.recommendations.trends}?limit=${limit}`, { signal }) })
}
export function useGetSearchUsersQuery(arg: { criteria: SearchCriteria; viewer: SearchViewerContext } | typeof skipToken) {
  const query = useInfiniteQuery({
    queryKey: ['discovery', 'search', arg === skipToken ? null : arg], enabled: arg !== skipToken,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      if (arg === skipToken) throw new Error('Введіть пошуковий запит.')
      const params = serializeSearchApiCriteria(arg.criteria, 'users')
      params.set('limit', '20')
      if (pageParam) params.set('cursor', pageParam)
      const page = await apiClient.get<CursorPage<BackendUser<UserShort>>>(`${ENDPOINTS.search.users}?${params}`, { signal })
      return { ...page, items: page.items.map(mapUserRole) }
    },
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  const data = query.data?.pages.flatMap(page => page.items)
  return { ...query, data, currentData: data, hasMore: query.hasNextPage, loadMore: query.fetchNextPage }
}
