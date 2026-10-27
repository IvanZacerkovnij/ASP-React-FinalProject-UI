import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../constants/app'
import { cn } from '../lib/cn'

export function AppLogo({ className, to = '/' }: { className?: string; to?: string }) {
  return <NavLink to={to} className={cn('text-4xl font-black tracking-tight text-primary leading-none', className)}>{APP_NAME}</NavLink>
}
