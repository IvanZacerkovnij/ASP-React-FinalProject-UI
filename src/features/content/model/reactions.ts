import type { QueryClient } from '@tanstack/react-query'
import { sendReaction } from '../api/operations'
import { reactionKey, matches, type Reaction } from './types'
import { withPollVote } from '../lib/poll'
import type { Tweet } from '../types/tweet'
import { api } from '../../../shared/api/client'

const requests = new WeakMap<QueryClient, Map<string, Promise<boolean>>>()

export function transformTweets(value: unknown, update: (tweet: Tweet) => Tweet): unknown {
  if (Array.isArray(value)) return value.map(item => transformTweets(item, update))
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  const mapped = Object.fromEntries(Object.entries(record).map(([key, item]) => [key, transformTweets(item, update)]))
  return typeof record.id === 'string' && 'retweetsCount' in record && 'author' in record ? update(mapped as unknown as Tweet) : mapped
}

export function runReaction(client: QueryClient, arg: Reaction, current: () => boolean): Promise<boolean> {
  let pending = requests.get(client)
  if (!pending) { pending = new Map(); requests.set(client, pending) }
  const key = `${api.getSessionId() ?? 'anonymous'}:${reactionKey(arg)}`
  const existing = pending.get(key)
  if (existing) return existing
  const run = async () => {
    await client.cancelQueries({ predicate: query => ['content', 'discovery'].includes(String(query.queryKey[0])) })
    if (!current()) return false
    let previous: Partial<Tweet> | undefined
    const patch = (update: (tweet: Tweet) => Tweet) => {
      if (!current()) return
      client.setQueriesData({ predicate: query => ['content', 'discovery', 'moderation'].includes(String(query.queryKey[0])) },
        data => transformTweets(data, tweet => matches(tweet, arg) ? update(tweet) : tweet))
    }
    patch(tweet => {
      if (arg.action === 'vote') {
        previous ??= { poll: tweet.poll }
        return { ...tweet, poll: withPollVote(arg.poll, arg.optionId) }
      }
      if (arg.action === 'like') {
        previous ??= { likedByMe: tweet.likedByMe, likesCount: tweet.likesCount }
        return { ...tweet, likedByMe: !arg.active, likesCount: Math.max(0, tweet.likesCount + (arg.active ? -1 : 1)) }
      }
      if (arg.action === 'repost') {
        previous ??= { repostedByMe: tweet.repostedByMe, retweetsCount: tweet.retweetsCount }
        return { ...tweet, repostedByMe: !arg.active, retweetsCount: Math.max(0, tweet.retweetsCount + (arg.active ? -1 : 1)) }
      }
      previous ??= { bookmarkedByMe: tweet.bookmarkedByMe }
      return { ...tweet, bookmarkedByMe: !arg.active }
    })
    try {
      const data = await sendReaction(arg)
      if (!current()) return false
      patch(tweet => ({ ...tweet, ...data }))
      if (arg.action === 'vote' && data.poll) client.setQueryData(['content', 'poll', { id: arg.id, type: arg.type }], data.poll)
      return true
    } catch (error) {
      patch(tweet => ({ ...tweet, ...previous }))
      throw error
    } finally {
      if (current()) await Promise.all(['content', 'profiles', 'discovery'].map(domain => client.invalidateQueries({ queryKey: [domain] })))
    }
  }
  const promise = run().finally(() => { pending!.delete(key) })
  pending.set(key, promise)
  return promise
}
