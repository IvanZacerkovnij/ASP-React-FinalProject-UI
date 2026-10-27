import { Link } from 'react-router-dom'
import { AccountConnections } from '../../features/auth/components/AccountConnections'
import { APP_ROUTES } from '../../shared/config/routes'

export default function AccountSecurityPage() {
  return <section>
    <h1 className="text-2xl font-bold">Безпека акаунта</h1>
    <Link to={APP_ROUTES.SETTINGS_CHANGE_PASSWORD} className="text-primary hover:underline">Змінити пароль</Link>
    <AccountConnections />
  </section>
}
