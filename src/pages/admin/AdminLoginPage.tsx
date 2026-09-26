import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useToast } from '../../features/toast/useToast'
import { Button, Spinner } from '../../components/ui'
import { Field } from '../../components/ui/Field'
import './admin.css'

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/too-many-requests': 'Too many attempts. Please try again in a minute.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}

/**
 * Admin sign-in is deliberately email/password only — Google accounts are
 * customer accounts. Access still requires the `admin` custom claim.
 */
export function AdminLoginPage() {
  const { signInWithEmail, user, isAdmin, loading } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner label="Checking session…" />
  if (user && isAdmin) return <Navigate to="/admin" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signInWithEmail(email.trim(), password)
      notify('Signed in. Verifying admin access…', 'info')
      navigate('/admin', { replace: true })
    } catch (cause) {
      const code = (cause as { code?: string })?.code ?? 'auth/unknown'
      setError(ERROR_MESSAGES[code] ?? 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin">
      <div className="admin-denied">
        <h1>Admin sign in</h1>
        <p className="muted">Staff only. Customers sign in with Google on the main site.</p>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: '1.25rem' }}>
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p className="auth-card__error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>
        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <a href="/">← Back to Foodie</a>
        </p>
      </div>
    </div>
  )
}
