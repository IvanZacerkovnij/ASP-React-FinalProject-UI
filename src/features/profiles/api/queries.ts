import { useInfiniteQuery, useQuery, skipToken } from '@tanstack/react-query'
import { apiClient } from '../../../shared/api/domain-client'
import { ENDPOINTS } from '../../../shared/api/endpoints'
import { mapUserRole, type BackendUser } from './mappers/user.mapper'
import type { CursorPage } from '../../../shared/types/api'
import type { User, UserShort } from '../types/user'

export function useGetProfileQuery(username: string | typeof skipToken) {
  const query = useQuery({
    queryKey: ['profiles', 'profile', username === skipToken ? null : username],
    enabled: username !== skipToken,
    queryFn: async ({ signal }) => mapUserRole(await apiClient.get<BackendUser<User>>(ENDPOINTS.users.byUsername(String(username)), { signal })),
  })
  return { ...query, currentData: query.data }
}

function useFollowList(id: string | typeof skipToken, kind: 'followers' | 'following') {
  const query = useInfiniteQuery({
    queryKey: ['profiles', kind, id === skipToken ? null : id],
    enabled: id !== skipToken,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: '50' })
      if (pageParam) params.set('cursor', pageParam)
      const page = await apiClient.get<CursorPage<BackendUser<UserShort>>>(`${ENDPOINTS.follows[kind](String(id))}?${params}`, { signal })
      return { ...page, items: page.items.map(mapUserRole) }
    },
    getNextPageParam: page => page.hasMore ? page.nextCursor ?? undefined : undefined,
  })
  const items = query.data?.pages.flatMap(page => page.items)
  const data = items?.filter((item, index) => items.findIndex(other => other.id === item.id) === index)
  return { ...query, data, currentData: data, hasMore: query.hasNextPage, loadMore: query.fetchNextPage }
}
export const useGetFollowingQuery = (id: string | typeof skipToken) => useFollowList(id, 'following')
export const useGetFollowersQuery = (id: string | typeof skipToken) => useFollowList(id, 'followers')
