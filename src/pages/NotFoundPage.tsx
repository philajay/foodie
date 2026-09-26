import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="container">
      <div className="card-surface" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h1>404 — Page not found</h1>
        <p className="muted">The page you&apos;re looking for doesn&apos;t exist (or the dish is off the menu).</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  )
}
