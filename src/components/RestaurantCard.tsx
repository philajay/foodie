import { Link } from 'react-router-dom'
import { formatPrice, priceRange } from '../lib/format'
import type { MenuItem, Restaurant } from '../types'
import { useMostSoldItems } from '../hooks/useMostSoldItems'
import { useCart } from '../features/cart/useCart'
import { useToast } from '../features/toast/useToast'
import { RatingBadge, SmartImage, VegDot } from './ui'
import './RestaurantCard.css'

interface RestaurantCardProps {
  restaurant: Restaurant
}

function MostSoldRow({ item, restaurantName, disabled }: { item: MenuItem; restaurantName: string; disabled: boolean }) {
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

  const addDisabled = disabled || !item.inStock

  return (
    <li className="card__bestseller-row">
      <SmartImage src={item.image} alt={item.name} className="card__bestseller-img" />
      <div className="card__bestseller-info">
        <span className="card__bestseller-name">
          <VegDot isVeg={item.isVeg} />
          {item.name}
        </span>
        <span className="card__bestseller-price">
          {formatPrice(item.price)}
          {item.soldCount != null && item.soldCount > 0 ? ` • ${item.soldCount} sold` : null}
        </span>
      </div>
      {inCart > 0 ? (
        <div className="stepper stepper--small">
          <button type="button" onClick={() => setQuantity(item.id, inCart - 1)} aria-label="Decrease">
            −
          </button>
          <span>{inCart}</span>
          <button type="button" onClick={() => setQuantity(item.id, inCart + 1)} aria-label="Increase">
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="card__bestseller-add"
          onClick={handleAdd}
          disabled={addDisabled}
        >
          Add
        </button>
      )}
    </li>
  )
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { items: mostSold, loading } = useMostSoldItems(restaurant.id, 3)
  return (
    <article className={`card ${restaurant.isOpen ? '' : 'card--closed'}`}>
      <Link to={`/restaurant/${restaurant.id}`} className="card__media-link">
        <SmartImage
          src={restaurant.coverImage}
          alt={restaurant.name}
          className="card__media"
          eager={false}
        />
        {restaurant.offer ? <span className="card__offer">{restaurant.offer}</span> : null}
        {!restaurant.isOpen ? <span className="card__closed">Closed today</span> : null}
      </Link>

      <div className="card__body">
        <div className="card__title-row">
          <h3 className="card__title">
            <Link to={`/restaurant/${restaurant.id}`}>{restaurant.name}</Link>
          </h3>
          {restaurant.vegOnly ? <VegDot isVeg /> : null}
        </div>
        <p className="card__cuisines">{restaurant.cuisines.join(' • ') || 'Multi-cuisine'}</p>
        <div className="card__meta">
          <span>{priceRange(restaurant.priceForTwo)}</span>
          <span>•</span>
          <span>{restaurant.deliveryTime} min</span>
          <RatingBadge rating={restaurant.rating} ratingCount={restaurant.ratingCount} />
        </div>

        {!loading && mostSold.length > 0 ? (
          <div className="card__bestsellers">
            <p className="card__bestsellers-title">Most Sold</p>
            <ul className="card__bestseller-list">
              {mostSold.map((item) => (
                <MostSoldRow
                  key={item.id}
                  item={item}
                  restaurantName={restaurant.name}
                  disabled={!restaurant.isOpen}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  )
}
