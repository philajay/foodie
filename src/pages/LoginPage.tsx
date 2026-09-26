import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { useToast } from '../features/toast/useToast'
import { Button } from '../components/ui'
import './AuthPages.css'

export function LoginPage() {
  const { signInWithGoogle, user } = useAuth()
  const { notify } = useToast()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirect = searchParams.get('redirect') ?? '/'

  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={redirect} replace />

  const handleGoogleSignIn = async () => {
    setSubmitting(true)
    try {
      await signInWithGoogle()
      navigate(redirect, { replace: true })
    } catch (cause) {
      const code = (cause as { code?: string })?.code ?? ''
      // The user closing the popup is not an error worth shouting about.
      if (!code.includes('popup-closed-by-user')) {
        notify(cause instanceof Error ? cause.message : 'Google sign-in failed', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome to Foodie</h1>
        <p className="muted">Sign in with Google to order food and track your deliveries.</p>

        <Button fullWidth loading={submitting} onClick={handleGoogleSignIn}>
          <span aria-hidden="true">G</span> Continue with Google
        </Button>

        <p className="auth-card__switch muted">
          By continuing you agree to our terms. Your name and email are used only for your orders.
        </p>
      </div>
    </div>
  )
}
