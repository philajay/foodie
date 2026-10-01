import { useEffect, useState } from 'react'
import { getMostSoldItems, listMenu } from '../services/menu'
import type { MenuItem } from '../types'

export function useMostSoldItems(restaurantId: string, count = 3) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    listMenu(restaurantId)
      .then((menu) => {
        if (active) {
          setItems(getMostSoldItems(menu, count))
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setItems([])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [restaurantId, count])

  return { items, loading }
}
