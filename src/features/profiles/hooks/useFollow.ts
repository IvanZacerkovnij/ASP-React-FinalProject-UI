import { useEffect } from 'react'
import { skipToken, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuth } from "../../auth/index";
import { useGetFollowingQuery, useGetFollowersQuery } from '../api/queries'
import { followApi } from '../api/follow.api'
import { useServerMutation } from '../../../shared/api/query-helpers'
import type { UserShort } from '../types/user'
import { api } from '../../../shared/api/client'

const EMPTY: UserShort[] = []
const inFlight = new WeakMap<QueryClient, Map<string, Promise<void>>>()
export function useFollow() {
  const client = useQueryClient()
  const { user } = useAuth()
  const followingQuery = useGetFollowingQuery(user?.id ?? skipToken)
  const followersQuery = useGetFollowersQuery(user?.id ?? skipToken)
  const { hasNextPage, isFetching, fetchNextPage, error } = followingQuery
  useEffect(() => {
    if (hasNextPage && !isFetching && !error) void fetchNextPage()
  }, [hasNextPage, isFetching, fetchNextPage, error])
  const { hasNextPage: hasFollowers, isFetching: fetchingFollowers, fetchNextPage: fetchFollowers, error: followersError } = followersQuery
  useEffect(() => {
    if (hasFollowers && !fetchingFollowers && !followersError) void fetchFollowers()
  }, [hasFollowers, fetchingFollowers, fetchFollowers, followersError])
  const [mutate, state] = useServerMutation(async (input: { target: UserShort; action: 'follow' | 'unfollow' | 'remove' }) => {
    if (!user || user.id === input.target.id) return
    if (input.action === 'remove') await followApi.removeFollower({ userId: user.id, followId: input.target.id })
    else await followApi[input.action]({ targetUserId: input.target.id })
  }, ['profiles', 'content', 'discovery', 'auth'])
  const run = (target: UserShort, action: 'follow' | 'unfollow' | 'remove') => {
    let pending = inFlight.get(client)
    if (!pending) { pending = new Map(); inFlight.set(client, pending) }
    const key = `${api.getSessionId()}:${user?.id}:${target.id}:${action === 'remove' ? 'follower' : 'following'}`
    const existing = pending.get(key)
    if (existing) return existing
    const promise = mutate({ target, action }).finally(() => { pending!.delete(key) })
    pending.set(key, promise)
    return promise
  }
  const following = followingQuery.data ?? EMPTY
  const followers = followersQuery.data ?? EMPTY
  return {
    following, followers, followingCount: user?.followingCount ?? following.length, followersCount: user?.followersCount ?? followers.length,
    follow: (target: UserShort) => run(target, 'follow'),
    unfollow: (target: UserShort) => run(target, 'unfollow'),
    removeFollower: (target: UserShort) => run(target, 'remove'),
    isFollowing: (id: string) => following.some(item => item.id === id),
    pending: state.isLoading || followingQuery.isFetching || Boolean(followingQuery.hasNextPage && !followingQuery.error), error: state.error,
  }
}
