import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { CartDrawer } from './components/CartDrawer'
import { ToastViewport } from './components/ToastViewport'
import { AdminGuard, AdminLayout } from './components/admin/AdminShell'
import { Spinner } from './components/ui'
import { AuthProvider } from './features/auth/AuthProvider'
import { useAuth } from './features/auth/useAuth'
import { CartProvider } from './features/cart/CartProvider'
import { ToastProvider } from './features/toast/ToastProvider'
import { HomePage } from './pages/HomePage'

// Route-level code splitting keeps the first paint small.
const RestaurantPage = lazy(() =>
  import('./pages/RestaurantPage').then((m) => ({ default: m.RestaurantPage })),
)
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
)
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
)
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })),
)
const AdminRestaurantsPage = lazy(() =>
  import('./pages/admin/AdminRestaurantsPage').then((m) => ({ default: m.AdminRestaurantsPage })),
)
const AdminRestaurantMenuPage = lazy(() =>
  import('./pages/admin/AdminRestaurantMenuPage').then((m) => ({ default: m.AdminRestaurantMenuPage })),
)
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

/** Customer-facing site. */
function SiteShell() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <>
        <Header />
        <Spinner label="Starting Foodie…" />
      </>
    )
  }

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

/** Staff back office — deliberately rendered without the customer header. */
function AdminShell() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="restaurants/:id/menu" element={<AdminRestaurantMenuPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

function Router() {
  const { pathname } = useLocation()
  const isAdminArea = pathname.startsWith('/admin')
  return isAdminArea ? <AdminShell /> : <SiteShell />
}

/** Provider order matters: Toast wraps everything, Cart is consumed by Header. */
export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Router />
          <CartDrawer />
          <ToastViewport />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
