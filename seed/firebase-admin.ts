import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage, type Storage } from 'firebase-admin/storage'
import { loadEnvFiles } from './env'

loadEnvFiles()

export const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID
export const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET ?? process.env.FIREBASE_STORAGE_BUCKET

/** Emulators ignore credentials, so a service account is not needed locally. */
export const usesEmulators = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.STORAGE_EMULATOR_HOST,
)

let cached: App | undefined

export function adminApp(): App {
  if (cached) return cached
  cached = getApps()[0]
  if (cached) return cached

  if (!projectId) throw new Error('VITE_FIREBASE_PROJECT_ID is missing from .env.local')
  if (!bucketName) throw new Error('VITE_FIREBASE_STORAGE_BUCKET is missing from .env.local')

  if (usesEmulators) {
    cached = initializeApp({ projectId, storageBucket: bucketName })
    return cached
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  // Falls back to Application Default Credentials
  // (gcloud auth application-default login) when no key file is provided.
  const credential = serviceAccountPath ? cert(serviceAccountPath) : applicationDefault()

  try {
    cached = initializeApp({ credential, projectId, storageBucket: bucketName })
  } catch (cause) {
    throw new Error(
      `Could not initialise firebase-admin: ${cause instanceof Error ? cause.message : String(cause)}\n` +
        'Fix either by:\n' +
        '  • gcloud auth application-default login, or\n' +
        '  • GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json (Project settings > Service accounts)',
    )
  }
  return cached
}

export function firestore(): Firestore {
  return getFirestore(adminApp())
}

export function storage(): Storage {
  return getStorage(adminApp())
}
