import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import type { Location } from "../types/location";

const realLocationApi = {
  search: (query: string, signal?: AbortSignal) =>
    apiClient.get<Location[]>(
      `${ENDPOINTS.search.locations}?q=${encodeURIComponent(query)}`,
      { signal },
    ),
};

export const locationApi = realLocationApi;
