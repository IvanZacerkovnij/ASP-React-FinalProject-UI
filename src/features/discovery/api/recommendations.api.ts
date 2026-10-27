import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import { mapUserRole, type BackendUser } from "../../profiles/mapping";
import { mapPostToTweet, type BackendPost } from "../../content/mapping";
import type { CursorPage } from "../../../shared/types/api";
import type { PaginatedRecommendedPosts } from "../types/recommendations";
import type { PaginatedRecommendations } from "../types/recommendations";
import type { TrendRecommendationsResponse } from "../types/recommendations";

interface RecommendationsApi {
  posts(limit: number, cursor?: string | null): Promise<PaginatedRecommendedPosts>;
  trends(limit: number): Promise<TrendRecommendationsResponse>;
  users(
    limit: number,
    cursor?: string | null,
  ): Promise<PaginatedRecommendations>;
}

const realRecommendationsApi: RecommendationsApi = {
  posts: async (limit, cursor) => {
    const params = new URLSearchParams({ limit: String(limit) });

    if (cursor) params.set("cursor", cursor);

    const page = await apiClient.get<CursorPage<BackendPost>>(
      `${ENDPOINTS.recommendations.posts}?${params}`,
    );

    return { ...page, items: page.items.map(mapPostToTweet) };
  },

  trends: (limit) =>
    apiClient.get<TrendRecommendationsResponse>(
      `${ENDPOINTS.recommendations.trends}?${new URLSearchParams({ limit: String(limit) })}`,
    ),

  users: async (limit, cursor) => {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    if (cursor) params.set("cursor", cursor);

    const page = await apiClient.get<
      CursorPage<BackendUser<PaginatedRecommendations["items"][number]>>
    >(`${ENDPOINTS.recommendations.users}?${params}`);

    return { ...page, items: page.items.map(mapUserRole) };
  },
};

export const recommendationsApi: RecommendationsApi = realRecommendationsApi;
