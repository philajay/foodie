import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { countMenuItems } from '../../services/menu'
import { countRestaurants, listRestaurants } from '../../services/restaurants'
import { subscribeToAllOrders } from '../../services/orders'
import { formatDate, formatPrice } from '../../lib/format'
import { ORDER_STATUS_FLOW } from '../../config/billing'
import { EmptyState, ErrorNote, Spinner } from '../../components/ui'
import './admin.css'

interface OrderStats {
  orders: number
  revenue: number
  byStatus: Record<string, number>
}

interface CatalogueStats {
  restaurants: number
  dishes: number
  open: number
}

export function AdminOverviewPage() {
  // Order and catalogue stats arrive from independent sources; keeping them in
  // separate state stops one subscription from clobbering the other.
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [catalogue, setCatalogue] = useState<CatalogueStats | null>(null)
  const [recent, setRecent] = useState<{ id: string; restaurantName: string; total: number; status: string; placedAt: Date }[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const unsubscribe = subscribeToAllOrders(
      (orders) => {
        if (!active) return
        const byStatus: Record<string, number> = {}
        orders.forEach((order) => {
          byStatus[order.status] = (byStatus[order.status] ?? 0) + 1
        })
        setRecent(
          orders.slice(0, 8).map((order) => ({
            id: order.id,
            restaurantName: order.restaurantName,
            total: order.total,
            status: order.status,
            placedAt: order.placedAt,
          })),
        )
        setOrderStats({
          orders: orders.length,
          revenue: orders
            .filter((order) => order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.total, 0),
          byStatus,
        })
      },
      (cause) => active && setError(cause.message),
    )

    void (async () => {
      try {
        const [restaurants, restaurantCount] = await Promise.all([
          listRestaurants(),
          countRestaurants(),
        ])
        const dishCounts = await Promise.all(
          restaurants.map((restaurant) => countMenuItems(restaurant.id)),
        )
        if (!active) return
        setCatalogue({
          restaurants: restaurantCount,
          dishes: dishCounts.reduce((sum, value) => sum + value, 0),
          open: restaurants.filter((restaurant) => restaurant.isOpen).length,
        })
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Failed to load stats')
      }
    })()

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (error) return <ErrorNote message={error} />
  if (!orderStats || !catalogue) return <Spinner label="Loading dashboard…" />

  return (
    <>
      <div className="admin__head">
        <h1>Overview</h1>
        <Link className="admin__link" to="/admin/restaurants">
          Manage restaurants →
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__label">Restaurants</div>
          <div className="stat__value">{catalogue.restaurants}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Dishes</div>
          <div className="stat__value">{catalogue.dishes}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Open now</div>
          <div className="stat__value">{catalogue.open}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Orders</div>
          <div className="stat__value">{orderStats.orders}</div>
        </div>
        <div className="stat">
          <div className="stat__label">Revenue</div>
          <div className="stat__value">{formatPrice(orderStats.revenue)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">In progress</div>
          <div className="stat__value">
            {ORDER_STATUS_FLOW.slice(0, -1).reduce(
              (sum, status) => sum + (orderStats.byStatus[status] ?? 0),
              0,
            )}
          </div>
        </div>
      </div>

      <h2>Recent orders</h2>
      {recent.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Placed</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((order) => (
              <tr key={order.id}>
                <td>{order.restaurantName}</td>
                <td>{formatDate(order.placedAt)}</td>
                <td>{order.status.replace(/_/g, ' ')}</td>
                <td>{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
