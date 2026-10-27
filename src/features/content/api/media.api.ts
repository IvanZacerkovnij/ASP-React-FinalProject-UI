import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import type { MediaAttachment } from "../types/media";

const realMediaApi = {
  async upload(file: File, options?: { onProgress?: (progress: number) => void; signal?: AbortSignal }): Promise<MediaAttachment> {
    const formData = new FormData();
    formData.append("File", file);

    options?.onProgress?.(0);
    const result = await apiClient.post<MediaAttachment>(ENDPOINTS.media.upload, formData, { signal: options?.signal });
    options?.onProgress?.(100);
    return result;
  },

  getById: (id: string) => apiClient.get<MediaAttachment>(ENDPOINTS.media.byId(id)),
};

export const mediaApi = realMediaApi;
