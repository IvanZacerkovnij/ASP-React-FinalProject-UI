import { useGetPostsQuery, errorMessage } from "../api/queries";

import type { Tweet } from "../types/tweet";

const EMPTY: Tweet[] = [];

export function useFeed() {
  const query = useGetPostsQuery({ kind: "feed" });

  return {
    reload: query.refetch,
    tweets: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error) : null,
  };
}
