import type { Tweet } from "../types/tweet";
import { type User } from "../../profiles/index";

export function updateTweetAuthors(items: Tweet[], user: User): void {
  const visited = new Set<Tweet>();

  const visit = (tweet: Tweet) => {
    if (visited.has(tweet)) return;
    visited.add(tweet);

    if (tweet.author.id === user.id) {
      tweet.author = {
        ...tweet.author,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        isVerified: user.isVerified,
        role: user.role,
      };
    }

    tweet.ancestors?.forEach(visit);
    if (tweet.quote?.target) visit(tweet.quote.target);
  };

  items.forEach(visit);
}
