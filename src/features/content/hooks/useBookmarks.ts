import { useGetPostsQuery, errorMessage } from "../api/queries";

import type { Tweet } from "../types/tweet";

const EMPTY: Tweet[] = [];

export function useBookmarks() {
  const query = useGetPostsQuery({ kind: "bookmarks" });

  return {
    pagination: { hasMore: query.hasMore, isFetching: query.isFetching, error: query.error, onLoadMore: query.loadMore, onRetry: query.isFetchNextPageError ? query.loadMore : query.refetch },
    tweets: query.data?.filter((tweet) => tweet.bookmarkedByMe) ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error) : null,
    reload: query.refetch,
  };
}
