import { useTweetReaction } from "./useTweetReaction";

import type { Tweet } from "../types/tweet";

export function useTweetBookmark(tweet: Tweet) {
  const { pending, toggle, error } = useTweetReaction(tweet, "bookmark");

  return {
    error,
    bookmarkedByMe: tweet.bookmarkedByMe,
    pending,
    toggleBookmark: toggle,
  };
}
