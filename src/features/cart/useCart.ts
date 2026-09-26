import { useContext } from 'react'
import { CartContext, type CartContextValue } from './cartContext'

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
