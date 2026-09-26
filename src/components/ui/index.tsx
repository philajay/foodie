import './primitives.css'
import { FALLBACK_IMAGE } from '../../lib/storage'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  /** Above-the-fold images should not lazy-load. */
  eager?: boolean
}

export function SmartImage({ src, alt, className = '', eager = false }: SmartImageProps) {
  return (
    <img
      className={`smart-image ${className}`.trim()}
      src={src || FALLBACK_IMAGE}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={(event) => {
        if (event.currentTarget.src !== FALLBACK_IMAGE) event.currentTarget.src = FALLBACK_IMAGE
      }}
    />
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__ring" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state__emoji" aria-hidden="true">
        🍽️
      </span>
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-note" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="link-button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`veg-dot ${isVeg ? 'veg-dot--veg' : 'veg-dot--nonveg'}`}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    />
  )
}

export function RatingBadge({ rating, ratingCount }: { rating: number; ratingCount?: number }) {
  return (
    <span className="rating-badge">
      {rating.toFixed(1)} ★{ratingCount ? ` (${ratingCount})` : ''}
    </span>
  )
}

export { Button } from './Button'
