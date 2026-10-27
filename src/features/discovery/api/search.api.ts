import { serializeSearchApiCriteria } from "../lib/search";

import { ENDPOINTS } from "../../../shared/api/endpoints";
import { apiClient } from "../../../shared/api/domain-client";
import { mapPostToTweet, type BackendPost } from "../../content/mapping";
import { mapUserRole, type BackendUser } from "../../profiles/mapping";
import type { SearchCriteria } from "../types/search";
import type { SearchViewerContext } from "../types/search";
import type { CursorPage } from "../../../shared/types/api";
import { type Tweet } from "../../content/index";
import { type UserShort } from "../../profiles/index";

interface SearchApi {
  users(
    criteria: SearchCriteria,
    viewer?: SearchViewerContext,
  ): Promise<UserShort[]>;
  posts(
    criteria: SearchCriteria,
    viewer?: SearchViewerContext,
  ): Promise<Tweet[]>;
}

const realSearchApi: SearchApi = {
  users: (criteria: SearchCriteria) =>
    apiClient
      .get<CursorPage<BackendUser<UserShort>>>(
        `${ENDPOINTS.search.users}?${serializeSearchApiCriteria(criteria, "users")}`,
      )
      .then((page) => page.items.map(mapUserRole)),

  posts: (criteria: SearchCriteria) =>
    apiClient
      .get<CursorPage<BackendPost>>(
        `${ENDPOINTS.search.posts}?${serializeSearchApiCriteria(criteria, "posts")}`,
      )
      .then((page): Tweet[] => page.items.map(mapPostToTweet)),
};

export const searchApi: SearchApi = realSearchApi;
