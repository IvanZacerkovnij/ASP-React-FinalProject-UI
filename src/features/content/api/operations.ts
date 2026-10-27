import { tweetApi } from "./tweet.api";
import { commentApi } from "./comment.api";
import { pollApi } from "./poll.api";

import type { Tweet } from "../types/tweet";

import type { Reaction } from "../model/types";

export async function sendReaction(arg: Reaction): Promise<Partial<Tweet>> {
  const api = arg.type === "comment" ? commentApi : tweetApi;

  switch (arg.action) {
    case "like": return api.toggleLike(arg.id, arg.active);
    case "repost": {
      const result = await api.toggleRepost(arg.id, arg.active);

      return {
        repostedByMe: result.repostedByMe,
        retweetsCount: result.repostsCount,
      };
    }
    case "bookmark": {
      const result = await api.toggleBookmark(arg.id, arg.active);
      const value =
        result && "isBookmarkedByCurrentUser" in result
          ? Boolean(result.isBookmarkedByCurrentUser)
          : result?.bookmarkedByMe;

      return { bookmarkedByMe: value ?? !arg.active };
    }
    case "vote": return { poll: await pollApi.vote(arg.type, arg.id, arg.optionId) };
  }
}
