import { useTweetReaction } from "./useTweetReaction";

import type { Tweet } from "../types/tweet";

export function useTweetRepost(tweet: Tweet) {
  const { pending, toggle, error } = useTweetReaction(tweet, "repost");

  return {
    error,
    repostedByMe: tweet.repostedByMe,
    repostsCount: tweet.retweetsCount,
    pending,
    toggleRepost: toggle,
    ensureReposted: () =>
      tweet.repostedByMe ? Promise.resolve(true) : toggle(),
  };
}
