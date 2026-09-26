import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '../../lib/firebase'
import { createProfile, subscribeToProfile } from '../../services/users'
import type { UserProfile } from '../../types'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Custom claims live on the ID token, not the user record. Re-read them on
  // every sign-in so a freshly granted claim takes effect without a redeploy.
  useEffect(() => {
    let active = true
    if (!user) {
      setIsAdmin(false)
      return
    }
    void getIdToken(user, true)
      .then((token) => {
        if (!active) return
        const claims = JSON.parse(atob(token.split('.')[1] ?? '{}'))
        setIsAdmin(claims.admin === true)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        await createProfile({
          uid: nextUser.uid,
          name: nextUser.displayName ?? 'Guest',
          email: nextUser.email ?? '',
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    return subscribeToProfile(user.uid, setProfile)
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin,
      loading,
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        await signInWithPopup(getFirebaseAuth(), provider)
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      },
      signOutUser: async () => {
        await signOut(getFirebaseAuth())
      },
    }),
    [user, profile, isAdmin, loading],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
