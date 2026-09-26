const env = import.meta.env

export const useEmulators = env.VITE_USE_FIREBASE_EMULATORS === 'true'

export const emulatorPorts = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
} as const

export const hasFirebaseConfig = Boolean(
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_STORAGE_BUCKET,
)

/**
 * Resolved lazily: importing this module must never throw, otherwise a missing
 * .env file would take down the whole app before the error boundary renders.
 */
export function getFirebaseConfig() {
  const missing = (
    [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ] as const
  ).filter((key) => !env[key])

  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured. Missing: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and paste your Firebase web app config.',
    )
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}
