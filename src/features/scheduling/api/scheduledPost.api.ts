import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import { mapScheduledLinkPreview } from "../../content/mapping";

import type { CreateScheduledPostRequest } from "../types/scheduledPost";
import type { ScheduledPost } from "../types/scheduledPost";
import { type Tweet } from "../../content/index";
import type { UpdateScheduledPostRequest } from "../types/scheduledPost";

const realScheduledPostApi = {
  list: () => apiClient.get<ScheduledPost[]>(ENDPOINTS.posts.scheduled),

  create: (request: CreateScheduledPostRequest) => {
    const { mockMedia: _mockMedia, ...payload } = request;
    void _mockMedia;
    return apiClient.post<ScheduledPost>(ENDPOINTS.posts.scheduled, {
      ...payload,
      content: payload.content?.trim() || null,
      linkPreview: mapScheduledLinkPreview(payload.linkPreview),
    });
  },

  update: (id: string, request: UpdateScheduledPostRequest) => {
    const { mockMedia: _mockMedia, ...payload } = request;
    void _mockMedia;
    return apiClient.patch<ScheduledPost>(
      ENDPOINTS.posts.scheduledById(id),
      {
        ...payload,
        ...(payload.content !== undefined ? { content: payload.content?.trim() || null } : {}),
        linkPreview: mapScheduledLinkPreview(payload.linkPreview),
      },
    );
  },

  delete: (id: string) =>
    apiClient.delete<void>(ENDPOINTS.posts.scheduledById(id)),

  publishDue: async (): Promise<Tweet[]> => [],
};

export const scheduledPostApi = realScheduledPostApi;
