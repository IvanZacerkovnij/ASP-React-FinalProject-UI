import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../../../shared/ui/Spinner'
import { APP_ROUTES, safeReturnTo } from '../../../shared/config/routes'

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  if (isLoading) return <Spinner className="size-8 text-primary" />
  if (isAuthenticated) return <Navigate to={location.pathname === APP_ROUTES.LOGIN ? safeReturnTo(from) : APP_ROUTES.HOME} replace />
  return <Outlet />
}
