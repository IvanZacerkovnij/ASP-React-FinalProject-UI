import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import { mapUserRole, type BackendUser } from "./mappers/user.mapper";

import type { CursorPage } from "../../../shared/types/api";
import type { FollowRequest } from "../types/follow";
import type { UserShort } from "../types/user";
import type { RemoveFollower } from "../types/follow";

function readUsers(response: unknown): UserShort[] {
  if (Array.isArray(response)) return (response as BackendUser<UserShort>[]).map(mapUserRole);

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray(response.items)
  )
    return (response.items as BackendUser<UserShort>[]).map(mapUserRole);

  throw new Error("Некоректна відповідь списку підписок.");
}

export const realFollowApi = {
  follow: (data: FollowRequest) =>
    apiClient.post<void>(ENDPOINTS.follows.follow(data.targetUserId)),

  unfollow: (data: FollowRequest) =>
    apiClient.delete<void>(ENDPOINTS.follows.unfollow(data.targetUserId)),

  followers: async (userId: string) =>
    readUsers(
      await apiClient.get<CursorPage<BackendUser<UserShort>>>(
        ENDPOINTS.follows.followers(userId),
      ),
    ),

  following: async (userId: string) =>
    readUsers(
      await apiClient.get<CursorPage<BackendUser<UserShort>>>(
        ENDPOINTS.follows.following(userId),
      ),
    ),

  removeFollower: (data: RemoveFollower) =>
    apiClient.delete<void>(
      ENDPOINTS.follows.removeFollower(data.userId, data.followId),
    ),
};

export const followApi = realFollowApi;
