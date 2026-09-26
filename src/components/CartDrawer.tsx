import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildBill } from '../config/billing'
import { useAuth } from '../features/auth/useAuth'
import { useCart } from '../features/cart/useCart'
import { formatPrice } from '../lib/format'
import type { CartLine } from '../types'
import { Button, EmptyState, SmartImage, VegDot } from './ui'
import './CartDrawer.css'

function QuantityStepper({
  line,
  onChange,
}: {
  line: CartLine
  onChange: (quantity: number) => void
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        onClick={() => onChange(line.quantity - 1)}
        aria-label={`Remove one ${line.name}`}
      >
        −
      </button>
      <span aria-live="polite">{line.quantity}</span>
      <button
        type="button"
        onClick={() => onChange(line.quantity + 1)}
        aria-label={`Add one ${line.name}`}
      >
        +
      </button>
    </div>
  )
}

export function CartDrawer() {
  const { lines, subtotal, isOpen, closeCart, setQuantity, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const bill = buildBill(subtotal)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeCart])

  if (!isOpen) return null

  const goToCheckout = () => {
    closeCart()
    navigate(user ? '/checkout' : '/login?redirect=/checkout')
  }

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Your cart">
      <div className="drawer__backdrop" onClick={closeCart} />
      <aside className="drawer__panel">
        <header className="drawer__header">
          <h2>Your cart</h2>
          <button type="button" className="drawer__close" onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </header>

        {lines.length === 0 ? (
          <EmptyState title="Your cart is empty" hint="Add dishes from a restaurant to get started." />
        ) : (
          <>
            <ul className="drawer__lines">
              {lines.map((line) => (
                <li key={line.menuItemId} className="cart-line">
                  <SmartImage src={line.image} alt={line.name} className="cart-line__image" />
                  <div className="cart-line__info">
                    <div className="cart-line__name">
                      <VegDot isVeg={line.isVeg} />
                      <span>{line.name}</span>
                    </div>
                    <span className="cart-line__price">{formatPrice(line.price)}</span>
                  </div>
                  <QuantityStepper line={line} onChange={(quantity) => setQuantity(line.menuItemId, quantity)} />
                  <button
                    type="button"
                    className="cart-line__remove"
                    onClick={() => removeItem(line.menuItemId)}
                    aria-label={`Remove ${line.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="drawer__bill">
              <div>
                <span>Item total</span>
                <strong>{formatPrice(bill.subtotal)}</strong>
              </div>
              <div>
                <span>Delivery fee</span>
                <strong>{bill.deliveryFee === 0 ? 'FREE' : formatPrice(bill.deliveryFee)}</strong>
              </div>
              <div>
                <span>Taxes & fees</span>
                <strong>{formatPrice(bill.taxes)}</strong>
              </div>
              <div className="drawer__total">
                <span>To pay</span>
                <strong>{formatPrice(bill.total)}</strong>
              </div>
            </div>

            <div className="drawer__actions">
              <Button fullWidth onClick={goToCheckout}>
                Proceed to checkout
              </Button>
              <Button variant="ghost" fullWidth onClick={clearCart}>
                Clear cart
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
