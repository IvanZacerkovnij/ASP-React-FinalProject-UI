import { useMemo } from "react";
import { skipToken } from "@tanstack/react-query";

import { SEARCH_DEBOUNCE_MS } from "../../../shared/constants/app";

import { useAuth } from "../../auth/index";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { useFollow } from "../../profiles/index";

import { hasActiveSearchCriteria } from "../lib/search";

import { useGetPostsQuery, errorMessage } from "../../content/index";
import { useGetSearchUsersQuery } from "../api/queries";

import type { SearchCriteria } from "../types/search";
import { type Tweet } from "../../content/index";
import { type UserShort } from "../../profiles/index";

const EMPTY_POSTS: Tweet[] = [];
const EMPTY_USERS: UserShort[] = [];

export function useSearch(criteria: SearchCriteria) {
  const { user } = useAuth();
  const { following } = useFollow();
  const debounced = useDebouncedValue<SearchCriteria | null>(
    criteria,
    SEARCH_DEBOUNCE_MS,
    null,
  );

  const hasCriteria = hasActiveSearchCriteria(criteria);
  const enabled = hasCriteria && debounced === criteria;

  const args = useMemo(() => {
    if (!enabled || !debounced) return null;

    return {
      criteria: debounced,
      viewer: {
        followingIds: following.map((item) => item.id),
        location: user?.location,
      },
    };
  }, [debounced, enabled, following, user?.location]);

  const posts = useGetPostsQuery(
    args && criteria.type === "posts" ? { kind: "search", ...args } : skipToken,
  );
  const users = useGetSearchUsersQuery(
    args && criteria.type === "users" ? args : skipToken,
  );
  const active = criteria.type === "posts" ? posts : users;
  const error = active.error;

  return {
    pagination: { hasMore: enabled && active.hasMore, isFetching: active.isFetching, error: enabled ? error : null, onLoadMore: active.loadMore, onRetry: active.isFetchNextPageError ? active.loadMore : active.refetch },
    users:
      enabled && criteria.type === "users"
        ? (users.currentData ?? EMPTY_USERS)
        : EMPTY_USERS,
    posts:
      enabled && criteria.type === "posts"
        ? (posts.currentData ?? EMPTY_POSTS)
        : EMPTY_POSTS,
    isLoading: hasCriteria && (!enabled || active.isFetching),
    error: enabled && error ? errorMessage(error) : null,
  };
}
