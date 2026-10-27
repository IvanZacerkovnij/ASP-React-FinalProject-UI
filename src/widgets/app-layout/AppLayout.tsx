import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" aria-label="Threads home">Threads</Link>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
