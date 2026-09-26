import { useEffect, useState } from 'react'
import { setOrderStatus, subscribeToAllOrders } from '../../services/orders'
import { useToast } from '../../features/toast/useToast'
import { formatDate, formatPrice } from '../../lib/format'
import { ORDER_STATUS_FLOW } from '../../config/billing'
import { Button, EmptyState, ErrorNote, Spinner } from '../../components/ui'
import type { Order, OrderStatus } from '../../types'
import './admin.css'

const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled']

export function AdminOrdersPage() {
  const { notify } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    return subscribeToAllOrders(
      (data) => {
        setOrders(data)
        setLoading(false)
      },
      (cause) => {
        setError(cause.message)
        setLoading(false)
      },
    )
  }, [])

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id)
    try {
      await setOrderStatus(order.id, status)
      notify(`${order.restaurantName} → ${status.replace(/_/g, ' ')}`, 'success')
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Status update failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading orders…" />
  if (error) return <ErrorNote message={error} />

  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  return (
    <>
      <div className="admin__head">
        <h1>Orders</h1>
        <div className="row">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All ({orders.length})
          </Button>
          {ALL_STATUSES.filter((status) => status !== 'delivered').map((status) => {
            const count = orders.filter((order) => order.status === status).length
            return (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'secondary'}
                onClick={() => setFilter(status)}
              >
                {status.replace(/_/g, ' ')} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No orders in this state" />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Placed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.restaurantName}</strong>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>
                    {order.id.slice(0, 10)}… • {order.paymentMode}
                  </div>
                </td>
                <td>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {order.address.label} · {order.address.city}
                  </div>
                </td>
                <td>
                  {order.items.map((item) => (
                    <div key={item.menuItemId} style={{ fontSize: '0.82rem' }}>
                      {item.quantity}× {item.name}
                    </div>
                  ))}
                </td>
                <td>{formatPrice(order.total)}</td>
                <td style={{ fontSize: '0.8rem' }}>{formatDate(order.placedAt)}</td>
                <td>
                  <div className="row" style={{ gap: '0.4rem', flexWrap: 'nowrap' }}>
                    <select
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(event) =>
                        changeStatus(order, event.target.value as OrderStatus)
                      }
                    >
                      {ALL_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
