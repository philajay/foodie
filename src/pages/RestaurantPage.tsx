import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRestaurant } from '../hooks/useRestaurant'
import { useCart } from '../features/cart/useCart'
import { useToast } from '../features/toast/useToast'
import { MENU_CATEGORY_ORDER } from '../services/menu'
import { formatPrice, priceRange } from '../lib/format'
import type { MenuItem } from '../types'
import { Button, EmptyState, ErrorNote, RatingBadge, SmartImage, Spinner, VegDot } from '../components/ui'
import './RestaurantPage.css'

function MenuRow({ item, restaurantName }: { item: MenuItem; restaurantName: string }) {
  const { addItem, quantityOf, setQuantity } = useCart()
  const { notify } = useToast()
  const inCart = quantityOf(item.id)

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      restaurantId: item.restaurantId,
      restaurantName,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      image: item.image,
      quantity: 1,
    })
    notify(`${item.name} added to cart`, 'success')
  }

  return (
    <li className="menu-row">
      <div className="menu-row__info">
        <div className="menu-row__title">
          <VegDot isVeg={item.isVeg} />
          <strong>{item.name}</strong>
          {item.rating ? <span className="menu-row__rating">★ {item.rating}</span> : null}
        </div>
        <p className="menu-row__price">
          {formatPrice(item.price)}
          {item.inStock ? null : ' • Out of stock'}
        </p>
        <p className="menu-row__desc">{item.description}</p>
      </div>
      <div className="menu-row__action">
        <SmartImage src={item.image} alt={item.name} className="menu-row__image" />
        {inCart > 0 ? (
          <div className="stepper stepper--floating">
            <button type="button" onClick={() => setQuantity(item.id, inCart - 1)} aria-label="Decrease">
              −
            </button>
            <span>{inCart}</span>
            <button type="button" onClick={() => setQuantity(item.id, inCart + 1)} aria-label="Increase">
              +
            </button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleAdd} disabled={!item.inStock}>
            Add
          </Button>
        )}
      </div>
    </li>
  )
}

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>()
  const { restaurant, menu, loading, error } = useRestaurant(id)
  const [query, setQuery] = useState('')
  const [vegOnly, setVegOnly] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return menu.filter((item) => {
      if (vegOnly && !item.isVeg) return false
      if (!needle) return true
      return `${item.name} ${item.description}`.toLowerCase().includes(needle)
    })
  }, [menu, query, vegOnly])

  const grouped = useMemo(() => {
    const groups = new Map<string, MenuItem[]>()
    filtered.forEach((item) => {
      const list = groups.get(item.category) ?? []
      list.push(item)
      groups.set(item.category, list)
    })
    return [...groups.entries()].sort(
      ([a], [b]) => MENU_CATEGORY_ORDER.indexOf(a as never) - MENU_CATEGORY_ORDER.indexOf(b as never),
    )
  }, [filtered])

  if (loading) return <div className="container"><Spinner label="Loading restaurant…" /></div>
  if (error || !restaurant) {
    return (
      <div className="container">
        <ErrorNote message={error ?? 'Restaurant not found'} />
        <Link to="/">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="restaurant-hero">
        <SmartImage src={restaurant.bannerImage} alt="" className="restaurant-hero__banner" eager />
        <div className="restaurant-hero__panel">
          <h1>{restaurant.name}</h1>
          <p className="muted">{restaurant.cuisines.join(', ')}</p>
          <div className="row">
            <RatingBadge rating={restaurant.rating} ratingCount={restaurant.ratingCount} />
            <span className="muted">{restaurant.deliveryTime} min delivery</span>
            <span className="muted">{priceRange(restaurant.priceForTwo)}</span>
            <span className="muted">{restaurant.address.line1}, {restaurant.address.city}</span>
          </div>
          {restaurant.offer ? <p className="restaurant-hero__offer">🎉 {restaurant.offer}</p> : null}
        </div>
      </div>

      <div className="menu-toolbar">
        <input
          type="search"
          placeholder="Search dishes in this restaurant"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search dishes"
        />
        <label className="switch">
          <input type="checkbox" checked={vegOnly} onChange={(event) => setVegOnly(event.target.checked)} />
          <span>Veg only</span>
        </label>
      </div>

      {grouped.length === 0 ? (
        <EmptyState title="No dishes match your search" />
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="menu-section">
            <h2>{category}</h2>
            <ul className="menu-list">
              {items.map((item) => (
                <MenuRow key={item.id} item={item} restaurantName={restaurant.name} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
