import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { useOrders } from '../hooks/useOrders'
import { cancelOrder } from '../services/orders'
import { useToast } from '../features/toast/useToast'
import { formatDate, formatPrice } from '../lib/format'
import { ORDER_STATUS_FLOW } from '../config/billing'
import { Button, EmptyState, ErrorNote, SmartImage, Spinner, VegDot } from '../components/ui'
import './OrdersPage.css'

export function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading, error } = useOrders(user?.uid)
  const { notify } = useToast()
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')

  if (authLoading) return <div className="container"><Spinner label="Checking session…" /></div>
  if (!user) return <Navigate to="/login?redirect=/orders" replace />

  return (
    <div className="container">
      <h1>Your orders</h1>

      {error ? <ErrorNote message={error} /> : null}
      {loading ? <Spinner label="Loading your orders…" /> : null}

      {!loading && orders.length === 0 ? (
        <EmptyState title="No orders yet" hint="Once you place an order it will show up here." />
      ) : null}

      <ul className="orders">
        {orders.map((order) => {
          const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status as never)
          return (
            <li
              key={order.id}
              className={`order ${order.id === highlight ? 'order--new' : ''}`}
            >
              <div className="order__head">
                <SmartImage src={order.restaurantImage} alt="" className="order__thumb" />
                <div>
                  <h2>{order.restaurantName}</h2>
                  <p className="muted">
                    {formatDate(order.placedAt)} • {order.paymentMode}
                  </p>
                  <p className="muted">
                    {order.address.line1}, {order.address.city} - {order.address.pincode}
                  </p>
                </div>
                <div className="order__amount">
                  <strong>{formatPrice(order.total)}</strong>
                  <span className={`order__status order__status--${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {order.status !== 'cancelled' && order.status !== 'delivered' ? (
                <ol className="tracker" aria-label="Order progress">
                  {ORDER_STATUS_FLOW.map((step, index) => (
                    <li
                      key={step}
                      className={`tracker__step ${index <= statusIndex ? 'is-done' : ''}`}
                    >
                      {step.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ol>
              ) : null}

              <ul className="order__items">
                {order.items.map((item) => (
                  <li key={item.menuItemId}>
                    <VegDot isVeg={item.isVeg} />
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>

              {order.status === 'placed' ? (
                <Button
                  variant="danger"
                  onClick={async () => {
                    try {
                      await cancelOrder(order.id)
                      notify('Order cancelled', 'info')
                    } catch (cause) {
                      notify(cause instanceof Error ? cause.message : 'Could not cancel', 'error')
                    }
                  }}
                >
                  Cancel order
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
