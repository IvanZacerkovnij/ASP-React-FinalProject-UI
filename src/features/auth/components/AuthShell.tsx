import type { ReactNode } from 'react'
import { AppLogo } from '../../../shared/ui/AppLogo'
import { APP_ROUTES } from '../../../shared/config/routes'
import { useAuth } from '../hooks/useAuth'

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle: string; children: ReactNode; footer: ReactNode
}) {
  const { error } = useAuth()
  return <div className="flex min-h-screen flex-col bg-background">
    <div className="flex items-center justify-between px-4 py-4">
      <AppLogo to={APP_ROUTES.LANDING} />
    </div>
    <div className="flex flex-1 items-center justify-center px-4 pb-16">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-balance text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground text-pretty">{subtitle}</p>
        {error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error.message}</p>}
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  </div>
}
