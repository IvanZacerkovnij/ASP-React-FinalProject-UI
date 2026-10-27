import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from "../../auth/index";
import { runReaction } from '../model/reactions'
import { reactionKey, targetOf } from '../model/types'
import type { Tweet } from '../types/tweet'

export function useTweetReaction(tweet: Tweet, action: 'like' | 'repost' | 'bookmark') {
  const client = useQueryClient()
  const { user, captureSession } = useAuth()
  const target = targetOf(tweet)
  const mutationKey = ['reaction', reactionKey({ ...target, action })]
  const mutation = useMutation({ mutationKey, mutationFn: async () => {
    if (!user) throw new Error('Увійдіть, щоб взаємодіяти з дописом.')
    const current = captureSession()
    const active = action === 'like' ? tweet.likedByMe : action === 'repost' ? tweet.repostedByMe : tweet.bookmarkedByMe
    return runReaction(client, { ...target, action, active }, current)
  } })
  const pending = useIsMutating({ mutationKey }) > 0
  return { pending, error: mutation.error, toggle: () => mutation.mutateAsync().catch(() => false) }
}
