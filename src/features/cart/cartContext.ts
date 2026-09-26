import { createContext } from 'react'
import type { CartLine } from '../../types'

export interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  restaurantId: string | null
  isOpen: boolean
  addItem: (line: CartLine) => void
  setQuantity: (menuItemId: string, quantity: number) => void
  removeItem: (menuItemId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  quantityOf: (menuItemId: string) => number
}

export const CartContext = createContext<CartContextValue | null>(null)
