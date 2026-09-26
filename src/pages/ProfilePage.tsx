import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { useToast } from '../features/toast/useToast'
import { removeAddress, uploadAvatar } from '../services/users'
import { Button, SmartImage, Spinner } from '../components/ui'
import './ProfilePage.css'

export function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const { notify } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <div className="container"><Spinner label="Loading profile…" /></div>
  if (!user) return <Navigate to="/login?redirect=/profile" replace />

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadAvatar(user.uid, file)
      notify('Profile photo updated', 'success')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="container">
      <div className="card-surface profile">
        <div className="profile__avatar">
          <SmartImage
            src={profile?.avatar ?? ''}
            alt="Profile photo"
            className="profile__photo"
            eager
          />
          <Button
            variant="secondary"
            onClick={() => fileInput.current?.click()}
            loading={uploading}
            type="button"
          >
            Change photo
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
          />
        </div>

        <div className="profile__details">
          <h1>{profile?.name || user.displayName || 'Your profile'}</h1>
          <p className="muted">{profile?.email ?? user.email}</p>
          {profile?.phone ? <p className="muted">📞 {profile.phone}</p> : null}
          {error ? <p className="auth-card__error">{error}</p> : null}
          <p className="muted profile__hint">
            Avatars are uploaded to Firebase Storage under <code>users/{user.uid}/avatar</code>.
          </p>
        </div>
      </div>

      <div className="card-surface">
        <h2>Saved addresses</h2>
        {profile?.addresses.length ? (
          <ul className="profile__addresses">
            {profile.addresses.map((address, index) => (
              <li key={`${address.label}-${index}`}>
                <div>
                  <strong>{address.label}</strong>
                  <span>
                    {address.line1}, {address.city} - {address.pincode}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await removeAddress(user.uid, index)
                    notify('Address removed', 'info')
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No saved addresses yet. Add one during checkout.</p>
        )}
      </div>
    </div>
  )
}