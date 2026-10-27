import { useServerMutation } from '../../../shared/api/query-helpers'
import { reportApi } from './report.api'
import type { CreateReportRequest } from '../types/report'

export const useCreateReportMutation = () => useServerMutation((input: CreateReportRequest) => reportApi.create(input), ['moderation'])
