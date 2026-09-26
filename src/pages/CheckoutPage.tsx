import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { buildBill } from '../config/billing'
import { useAuth } from '../features/auth/useAuth'
import { useCart } from '../features/cart/useCart'
import { useToast } from '../features/toast/useToast'
import { formatPrice } from '../lib/format'
import { placeOrder } from '../services/orders'
import { addAddress } from '../services/users'
import type { Address, Order } from '../types'
import { Button, EmptyState, SmartImage, VegDot } from '../components/ui'
import { Field } from '../components/ui/Field'
import './CheckoutPage.css'

const EMPTY_ADDRESS: Omit<Address, 'label'> = { line1: '', city: '', pincode: '' }

export function CheckoutPage() {
  const { user, profile } = useAuth()
  const { lines, subtotal, clearCart } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [label, setLabel] = useState('Home')
  const [paymentMode, setPaymentMode] = useState<Order['paymentMode']>('COD')
  const [saveAddress, setSaveAddress] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />

  const bill = buildBill(subtotal)
  const restaurantName = lines[0]?.restaurantName ?? ''
  const restaurantId = lines[0]?.restaurantId ?? ''

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setPlacing(true)
    setError(null)
    try {
      const fullAddress: Address = { ...address, label }
      if (saveAddress) {
        await addAddress(user.uid, fullAddress).catch(() => undefined)
      }
      const orderId = await placeOrder({
        userId: user.uid,
        restaurantId,
        restaurantName,
        restaurantImage: lines[0]?.image ?? '',
        lines,
        address: fullAddress,
        paymentMode,
      })
      clearCart()
      notify('Order placed successfully!', 'success')
      navigate(`/orders?highlight=${orderId}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not place the order')
    } finally {
      setPlacing(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="Nothing to check out"
          hint="Your cart is empty. Add a dish from any restaurant."
        />
        <div style={{ textAlign: 'center' }}>
          <Button onClick={() => navigate('/')}>Browse restaurants</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Checkout</h1>
      <div className="checkout">
        <form className="card-surface stack" onSubmit={handleSubmit}>
          <div>
            <h2>Delivery address</h2>
            {profile?.addresses.length ? (
              <div className="saved-addresses">
                {profile.addresses.map((saved, index) => (
                  <button
                    key={`${saved.label}-${index}`}
                    type="button"
                    className="saved-address"
                    onClick={() => setAddress({ line1: saved.line1, city: saved.city, pincode: saved.pincode })}
                  >
                    <strong>{saved.label}</strong>
                    <span>
                      {saved.line1}, {saved.city} - {saved.pincode}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Field
            label="Flat / street"
            required
            value={address.line1}
            onChange={(event) => setAddress({ ...address, line1: event.target.value })}
          />
          <Field
            label="City"
            required
            value={address.city}
            onChange={(event) => setAddress({ ...address, city: event.target.value })}
          />
          <Field
            label="Pincode"
            required
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            value={address.pincode}
            onChange={(event) => setAddress({ ...address, pincode: event.target.value })}
          />
          <Field
            label="Address label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />

          <fieldset className="payment">
            <legend>Payment method</legend>
            {(['COD', 'UPI'] as const).map((mode) => (
              <label key={mode} className="payment__option">
                <input
                  type="radio"
                  name="payment"
                  value={mode}
                  checked={paymentMode === mode}
                  onChange={() => setPaymentMode(mode)}
                />
                <span>{mode === 'COD' ? 'Cash on delivery' : 'UPI (demo — no real payment)'}</span>
              </label>
            ))}
          </fieldset>

          <label className="switch">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(event) => setSaveAddress(event.target.checked)}
            />
            <span>Save this address for next time</span>
          </label>

          {error ? <p className="auth-card__error">{error}</p> : null}

          <Button type="submit" fullWidth loading={placing}>
            Place order • {formatPrice(bill.total)}
          </Button>
        </form>

        <aside className="card-surface checkout__summary">
          <h2>Order summary</h2>
          <p className="muted">{restaurantName}</p>
          <ul className="checkout__items">
            {lines.map((line) => (
              <li key={line.menuItemId}>
                <SmartImage src={line.image} alt="" className="checkout__thumb" />
                <div>
                  <div className="checkout__item-name">
                    <VegDot isVeg={line.isVeg} />
                    <span>{line.name}</span>
                  </div>
                  <span className="muted">
                    {line.quantity} × {formatPrice(line.price)}
                  </span>
                </div>
                <strong>{formatPrice(line.quantity * line.price)}</strong>
              </li>
            ))}
          </ul>
          <div className="checkout__bill">
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
            <div className="checkout__total">
              <span>To pay</span>
              <strong>{formatPrice(bill.total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
