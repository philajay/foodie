import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { useCart } from '../features/cart/useCart'
import './Header.css'

const navClass = ({ isActive }: { isActive: boolean }) => `header__link ${isActive ? 'is-active' : ''}`

export function Header() {
  const { user, isAdmin, signOutUser } = useAuth()
  const { count, openCart } = useCart()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutUser()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand" aria-label="Foodie home">
          <span className="header__logo" aria-hidden="true">
            🍔
          </span>
          Foodie
        </Link>

        <form
          className="header__search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const value = new FormData(event.currentTarget).get('q')?.toString() ?? ''
            navigate(value ? `/?search=${encodeURIComponent(value)}` : '/')
          }}
        >
          <input
            type="search"
            name="q"
            placeholder="Search for biryani, pizza, burgers…"
            aria-label="Search restaurants"
            defaultValue={new URLSearchParams(window.location.search).get('search') ?? ''}
          />
        </form>

        <nav className="header__nav" aria-label="Primary">
          <NavLink to="/orders" className={navClass}>
            Orders
          </NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className={navClass}>
                {user.displayName ?? user.email?.split('@')[0] ?? 'Profile'}
              </NavLink>
              <button type="button" className="header__link" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navClass}>
              Log in
            </NavLink>
          )}
          <NavLink to="/admin" className="header__admin">
            {isAdmin ? 'Admin panel' : 'Admin'}
          </NavLink>
          <button type="button" className="header__cart" onClick={openCart} aria-label="Open cart">
            🛒
            {count > 0 ? <span className="header__cart-count">{count}</span> : null}
          </button>
        </nav>
      </div>
    </header>
  )
}
