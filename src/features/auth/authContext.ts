import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../../types'

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  /** True when the ID token carries the `admin` custom claim. */
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
