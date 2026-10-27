import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from "../../../auth/index";
import { runReaction } from '../../model/reactions'
import { reactionKey } from '../../model/types'
import { useGetPollStateQuery } from '../../api/queries'
import { pollsMatch } from '../../lib/poll'
import type { TweetPoll } from '../../types/poll'

export function usePollVote(tweetId: string, poll: TweetPoll, isComment = false, readOnly = false) {
  const client = useQueryClient()
  const { user, captureSession } = useAuth()
  const target = { id: tweetId, type: isComment ? 'comment' as const : 'post' as const }
  const query = useGetPollStateQuery(target, { skip: readOnly })
  const currentPoll = query.data && pollsMatch(poll, query.data) ? query.data : poll
  const mutationKey = ['reaction', reactionKey({ ...target, action: 'vote' })]
  const mutation = useMutation({ mutationKey, mutationFn: async (optionId: string) => {
    if (readOnly || !user || currentPoll.isClosed || currentPoll.votedOptionId ||
      (currentPoll.expiresAt && Date.parse(currentPoll.expiresAt) <= Date.now())) return false
    const current = captureSession()
    return runReaction(client, { ...target, action: 'vote', optionId, poll: currentPoll }, current)
  } })
  const loading = useIsMutating({ mutationKey }) > 0
  return { poll: currentPoll, loading, error: mutation.error, vote: (optionId: string) => mutation.mutateAsync(optionId).catch(() => false) }
}
