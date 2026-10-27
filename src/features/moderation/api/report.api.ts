import { apiClient } from "../../../shared/api/domain-client";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import type { CreateReportRequest } from "../types/report";

export const reportApi = {
  async create(data: CreateReportRequest): Promise<void> {
    await apiClient.post(ENDPOINTS[data.targetType].report(data.targetId), {
      reason: data.reason,
    });
  },
};
