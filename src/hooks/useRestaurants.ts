import { useEffect, useState } from 'react'
import { listRestaurants, type RestaurantFilters } from '../services/restaurants'
import type { Restaurant } from '../types'

interface AsyncState<T> {
  key: string
  data: T
  error: string | null
}

const message = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

export function useRestaurants(filters: RestaurantFilters) {
  const key = JSON.stringify(filters)
  const [state, setState] = useState<AsyncState<Restaurant[]>>({ key, data: [], error: null })

  useEffect(() => {
    let active = true
    listRestaurants(JSON.parse(key) as RestaurantFilters)
      .then((data) => {
        if (active) setState({ key, data, error: null })
      })
      .catch((cause: unknown) => {
        if (active) setState({ key, data: [], error: message(cause, 'Failed to load restaurants') })
      })
    return () => {
      active = false
    }
  }, [key])

  // Derived, so changing filters never triggers a cascading synchronous render.
  return {
    restaurants: state.key === key ? state.data : [],
    loading: state.key !== key,
    error: state.key === key ? state.error : null,
  }
}
