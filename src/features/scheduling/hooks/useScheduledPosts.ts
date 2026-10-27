import { useQuery } from '@tanstack/react-query'
import { useAuth } from "../../auth/index";
import { scheduledPostApi } from '../api/scheduledPost.api'
import { apiClient } from '../../../shared/api/domain-client'
import { ENDPOINTS } from '../../../shared/api/endpoints'
import { errorMessage, useServerMutation } from '../../../shared/api/query-helpers'
import type { CreateScheduledPostRequest, ScheduledPost, UpdateScheduledPostRequest } from '../types/scheduledPost'

const EMPTY: ScheduledPost[] = []
export function useScheduledPosts() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['scheduling', user?.id], enabled: Boolean(user),
    queryFn: ({ signal }) => apiClient.get<ScheduledPost[]>(ENDPOINTS.posts.scheduled, { signal }),
    refetchInterval: 60_000,
  })
  const [create] = useServerMutation((input: CreateScheduledPostRequest) => scheduledPostApi.create(input), ['scheduling'])
  const [update] = useServerMutation((input: { id: string; data: UpdateScheduledPostRequest }) => scheduledPostApi.update(input.id, input.data), ['scheduling'])
  const [remove] = useServerMutation((id: string) => scheduledPostApi.delete(id), ['scheduling'])
  const posts = query.data ? [...query.data].sort((left, right) => Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt)) : EMPTY
  return { posts, isLoading: query.isLoading, error: query.error ? errorMessage(query.error) : null,
    create, update: (id: string, data: UpdateScheduledPostRequest) => update({ id, data }), remove, refresh: query.refetch }
}
