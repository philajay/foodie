import { Link } from 'react-router-dom'
import { priceRange } from '../lib/format'
import type { Restaurant } from '../types'
import { RatingBadge, SmartImage, VegDot } from './ui'
import './RestaurantCard.css'

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
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
      </div>
    </article>
  )
}
