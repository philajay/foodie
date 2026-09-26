import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRestaurants } from '../hooks/useRestaurants'
import { RestaurantCard } from '../components/RestaurantCard'
import { EmptyState, ErrorNote, Spinner } from '../components/ui'
import { SelectField } from '../components/ui/Field'
import type { RestaurantFilters } from '../services/restaurants'
import './HomePage.css'

const SORTS: { value: NonNullable<RestaurantFilters['sort']>; label: string }[] = [
  { value: 'rating', label: 'Rating: high to low' },
  { value: 'delivery', label: 'Delivery time' },
  { value: 'cost_low', label: 'Cost: low to high' },
  { value: 'cost_high', label: 'Cost: high to low' },
]

const PRICE_CAPS = [300, 600, 1000]

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cuisine, setCuisine] = useState('')
  const [sort, setSort] = useState<NonNullable<RestaurantFilters['sort']>>('rating')
  const [vegOnly, setVegOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(0)

  const search = searchParams.get('search') ?? ''

  const filters = useMemo<RestaurantFilters>(
    () => ({
      search,
      cuisine: cuisine || undefined,
      sort,
      vegOnly: vegOnly || undefined,
      maxPrice: maxPrice || undefined,
    }),
    [search, cuisine, sort, vegOnly, maxPrice],
  )

  const { restaurants, loading, error } = useRestaurants(filters)

  return (
    <div className="container">
      <section className="hero">
        <h1>Order food you&apos;ll love</h1>
        <p>
          {loading ? 'Finding the best places near you…' : `${restaurants.length} restaurants delivering to you`}
        </p>
        <div className="hero__chips" aria-label="Popular cuisines">
          {['Biryani', 'Pizza', 'Burger', 'Chinese', 'Desserts'].map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${cuisine === item ? 'chip--active' : ''}`}
              onClick={() => setCuisine(cuisine === item ? '' : item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="filters" aria-label="Filters">
        <SelectField
          label="Sort by"
          value={sort}
          onChange={(event) => setSort(event.target.value as NonNullable<RestaurantFilters['sort']>)}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Max price for two"
          value={String(maxPrice)}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
        >
          <option value="0">Any</option>
          {PRICE_CAPS.map((cap) => (
            <option key={cap} value={cap}>
              Up to ₹{cap}
            </option>
          ))}
        </SelectField>

        <label className="switch">
          <input type="checkbox" checked={vegOnly} onChange={(event) => setVegOnly(event.target.checked)} />
          <span>Pure veg only</span>
        </label>

        {search ? (
          <button type="button" className="link-button" onClick={() => setSearchParams({})}>
            Clear search &quot;{search}&quot;
          </button>
        ) : null}
      </section>

      {search ? (
        <p className="muted">
          Showing results for <strong>{search}</strong>
        </p>
      ) : null}

      {error ? <ErrorNote message={error} /> : null}
      {loading ? <Spinner label="Loading restaurants…" /> : null}

      {!loading && restaurants.length === 0 ? (
        <EmptyState title="No restaurants found" hint="Try a different cuisine or clear your filters." />
      ) : null}

      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  )
}