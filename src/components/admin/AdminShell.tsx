import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Spinner } from '../ui'
import '../../pages/admin/admin.css'

/**
 * Client-side guard for convenience only — the real enforcement lives in
 * firestore.rules / storage.rules, which check the `admin` custom claim on
 * every write. Never rely on this component for security.
 */
export function AdminGuard() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <Spinner label="Checking admin access…" />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `admin__link ${isActive ? 'is-active' : ''}`

export function AdminLayout() {
  const { user, profile, signOutUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="admin">
      <header className="admin__bar">
        <a className="admin__brand" href="/">
          🍔 Foodie <span className="admin__tag">Admin</span>
        </a>
        <nav className="admin__nav">
          <NavLink to="/admin" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/admin/restaurants" className={navClass}>
            Restaurants
          </NavLink>
          <NavLink to="/admin/orders" className={navClass}>
            Orders
          </NavLink>
        </nav>
        <div className="admin__session">
          <span>{profile?.name || user?.email}</span>
          <a className="admin__link" href="/">
            View site
          </a>
          <button
            type="button"
            className="admin__link"
            onClick={async () => {
              await signOutUser()
              navigate('/admin/login')
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="admin__content">
        <Outlet />
      </main>
    </div>
  )
}
