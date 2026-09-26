import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { CartLine } from '../../types'
import { CartContext, type CartContextValue } from './cartContext'

const STORAGE_KEY = 'foodie.cart.v1'

interface CartState {
  lines: CartLine[]
}

type CartAction =
  | { type: 'add'; line: CartLine }
  | { type: 'setQuantity'; menuItemId: string; quantity: number }
  | { type: 'remove'; menuItemId: string }
  | { type: 'clear' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      // One restaurant per cart: switching restaurants starts a fresh cart.
      if (state.lines.length > 0 && state.lines[0].restaurantId !== action.line.restaurantId) {
        return { lines: [action.line] }
      }
      const existing = state.lines.find((line) => line.menuItemId === action.line.menuItemId)
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.menuItemId === action.line.menuItemId
              ? { ...line, quantity: line.quantity + action.line.quantity }
              : line,
          ),
        }
      }
      return { lines: [...state.lines, action.line] }
    }
    case 'setQuantity': {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((line) => line.menuItemId !== action.menuItemId) }
      }
      return {
        lines: state.lines.map((line) =>
          line.menuItemId === action.menuItemId ? { ...line, quantity: action.quantity } : line,
        ),
      }
    }
    case 'remove':
      return { lines: state.lines.filter((line) => line.menuItemId !== action.menuItemId) }
    case 'clear':
      return { lines: [] }
  }
}

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartLine[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Lazy initial state: the cart is read from localStorage exactly once.
  const [state, dispatch] = useReducer(cartReducer, null, () => ({ lines: readStoredCart() }))
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines))
  }, [state.lines])

  const value = useMemo<CartContextValue>(() => {
    const quantityOf = (menuItemId: string) =>
      state.lines.find((line) => line.menuItemId === menuItemId)?.quantity ?? 0

    return {
      lines: state.lines,
      count: state.lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: state.lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      restaurantId: state.lines[0]?.restaurantId ?? null,
      isOpen,
      addItem: (line) => dispatch({ type: 'add', line }),
      setQuantity: (menuItemId, quantity) => dispatch({ type: 'setQuantity', menuItemId, quantity }),
      removeItem: (menuItemId) => dispatch({ type: 'remove', menuItemId }),
      clearCart: () => dispatch({ type: 'clear' }),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      quantityOf,
    }
  }, [state.lines, isOpen])

  return <CartContext value={value}>{children}</CartContext>
}
