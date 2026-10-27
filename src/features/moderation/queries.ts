import { useQuery, skipToken } from '@tanstack/react-query'
import { adminApi } from './api'
import { useServerMutation } from '../../shared/api/query-helpers'
import type { AnalyticsPeriod, UsersParams, ModerationParams, UserAction } from './types'
import type { ReportDecision } from './types/report'

function useAdminQuery<Input, Output>(name: string, input: Input | typeof skipToken, run: (input: Input, signal?: AbortSignal) => Promise<Output>, options?: { skip?: boolean }) {
  const query = useQuery({ queryKey: ['moderation', name, input === skipToken ? null : input],
    enabled: input !== skipToken && !options?.skip,
    queryFn: ({ signal }) => {
      if (input === skipToken) throw new Error('Об’єкт не вибрано.')
      return run(input, signal)
    },
  })
  return { ...query, currentData: query.data }
}
export const useAdminUsersQuery = (params: UsersParams, options?: { skip?: boolean }) => useAdminQuery('users', params, adminApi.users, options)
export const useAdminUserQuery = (id: string | typeof skipToken) => useAdminQuery('user', id, adminApi.user)
export const useAdminReportsQuery = (params: ModerationParams, options?: { skip?: boolean }) => useAdminQuery('reports', params, adminApi.reports, options)
export const useAdminReportQuery = (id: string | typeof skipToken) => useAdminQuery('report', id, adminApi.report)
export const useAdminMetricsQuery = (input: undefined) => useAdminQuery('metrics', input, adminApi.metrics)
export const useAdminAnalyticsQuery = (period: AnalyticsPeriod) => useAdminQuery('analytics', period, adminApi.analytics)
export const useAdminTablesQuery = (limit: number) => useAdminQuery('tables', limit, adminApi.tables)
const changed = ['moderation', 'content', 'profiles', 'discovery', 'auth']
export const useAdminUserActionMutation = () => useServerMutation((input: { id: string; action: UserAction }) =>
  adminApi.actOnUser(input.id, input.action), changed)
export const useResolveReportMutation = () => useServerMutation((input: { id: string; decision: ReportDecision }) =>
  adminApi.resolveReport(input.id, input.decision), changed)
