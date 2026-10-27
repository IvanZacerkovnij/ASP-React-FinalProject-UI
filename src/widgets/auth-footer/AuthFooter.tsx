import { Link } from 'react-router-dom'
import { APP_NAME } from '../../shared/constants/app'
import { cn } from '../../shared/lib/cn'

const links = [
  { label: 'Про нас', to: '/about' },
  { label: 'Конфіденційність', to: '/privacy' },
  { label: 'Умови', to: '/terms' },
  { label: 'Допомога', to: '/help' },
]

export function AuthFooter({ className }: { className?: string }) {
  return <div className={cn('px-2 text-xs text-muted-foreground', className)}>
    <div className="flex flex-wrap gap-x-3 gap-y-1">{links.map(({ label, to }) => <Link key={to} to={to} className="hover:underline">{label}</Link>)}</div>
    <p className="mt-3">ASP.NET · TypeScript · React</p>
    <p className="mt-3">© {new Date().getFullYear()} {APP_NAME}</p>
  </div>
}
