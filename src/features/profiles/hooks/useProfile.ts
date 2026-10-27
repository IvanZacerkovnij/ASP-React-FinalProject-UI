import { skipToken } from "@tanstack/react-query";

import { useGetPostsQuery, errorMessage, type ProfileTab } from "../../content/index";
import { useGetProfileQuery } from "../api/queries";
export type { ProfileTab } from "../../content";

import { type Tweet } from "../../content/index";

const EMPTY: Tweet[] = [];

export function useProfile(
  username: string | undefined,
  activeTab: ProfileTab,
) {
  const profile = useGetProfileQuery(username ?? skipToken);
  const user = profile.currentData ?? null;
  const query = useGetPostsQuery(
    user
      ? { kind: "profile", username: user.username, tab: activeTab }
      : skipToken,
  );
  const isLoading = Boolean(username) && !user && profile.isFetching;

  return {
    pagination: { hasMore: query.hasMore, isFetching: query.isFetching, error: query.error, onLoadMore: query.loadMore, onRetry: query.isFetchNextPageError ? query.loadMore : query.refetch },
    user,
    tweets: query.currentData ?? EMPTY,
    isLoading,
    isTabLoading: query.isFetching && !query.currentData,
    notFound: !username || (!user && !isLoading && Boolean(profile.error)),
    tabError: query.error ? errorMessage(query.error) : null,
  };
}
