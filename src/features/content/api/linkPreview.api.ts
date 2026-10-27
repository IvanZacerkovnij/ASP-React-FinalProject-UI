import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import type { LinkPreview } from "../types/linkPreview";

const realLinkPreviewApi = {
  resolve(url: string, signal?: AbortSignal): Promise<LinkPreview> {
    return apiClient.post<LinkPreview>(
      ENDPOINTS.linkPreviews.resolve,
      { url },
      { signal },
    );
  },
};

export const linkPreviewApi = realLinkPreviewApi;
