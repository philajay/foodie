import { useEffect, useState } from 'react'
import { getRestaurant } from '../services/restaurants'
import { subscribeToMenu } from '../services/menu'
import type { MenuItem, Restaurant } from '../types'

interface State {
  id: string
  restaurant: Restaurant | null
  menu: MenuItem[]
  error: string | null
}

const message = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

export function useRestaurant(restaurantId: string | undefined) {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    if (!restaurantId) return
    let active = true

    getRestaurant(restaurantId)
      .then((restaurant) => {
        if (!active) return
        setState({
          id: restaurantId,
          restaurant,
          menu: [],
          error: restaurant ? null : 'Restaurant not found',
        })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setState({
          id: restaurantId,
          restaurant: null,
          menu: [],
          error: message(cause, 'Failed to load restaurant'),
        })
      })

    const unsubscribe = subscribeToMenu(
      restaurantId,
      (menu) => {
        if (active) setState((current) => (current?.id === restaurantId ? { ...current, menu } : current))
      },
      (cause) => {
        if (active) setState((current) => (current?.id === restaurantId ? { ...current, error: cause.message } : current))
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [restaurantId])

  // Derived state: a new id never renders the previous restaurant's data.
  if (!restaurantId) return { restaurant: null, menu: [], loading: false, error: null }
  if (state?.id !== restaurantId) return { restaurant: null, menu: [], loading: true, error: null }

  return {
    restaurant: state.restaurant,
    menu: state.menu,
    loading: state.restaurant === null && state.error === null,
    error: state.error,
  }
}
