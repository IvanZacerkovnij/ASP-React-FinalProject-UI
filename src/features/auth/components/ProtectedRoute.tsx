import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../../../shared/ui/Spinner'
import { APP_ROUTES } from '../../../shared/config/routes'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <Spinner className="size-8 text-primary" />
  if (!isAuthenticated) return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location }} />
  return <Outlet />
}
