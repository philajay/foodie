import { useEffect, useState } from 'react'
import { subscribeToMyOrders } from '../services/orders'
import type { Order } from '../types'

interface State {
  uid: string
  orders: Order[]
  error: string | null
}

export function useOrders(userId: string | undefined) {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    if (!userId) return
    return subscribeToMyOrders(
      userId,
      (orders) => setState({ uid: userId, orders, error: null }),
      (cause) => setState({ uid: userId, orders: [], error: cause.message }),
    )
  }, [userId])

  if (!userId) return { orders: [], loading: false, error: null }
  if (state?.uid !== userId) return { orders: [], loading: true, error: null }

  return { orders: state.orders, loading: false, error: state.error }
}
