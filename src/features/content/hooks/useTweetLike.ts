import { useTweetReaction } from "./useTweetReaction";

import type { Tweet } from "../types/tweet";

export function useTweetLike(tweet: Tweet) {
  const { pending, toggle, error } = useTweetReaction(tweet, "like");
  return {
    error,
    likedByMe: tweet.likedByMe,
    likesCount: tweet.likesCount,
    pending,
    toggleLike: toggle,
  };
}
