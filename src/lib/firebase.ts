import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'
import { emulatorPorts, getFirebaseConfig, useEmulators } from '../config/firebase-config'

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

/**
 * Lazy singletons. The Firebase SDK is only touched when a feature actually
 * needs it, so `npm run build` and unit tooling keep working without a .env file.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(getFirebaseConfig())
    if (useEmulators) {
      const host = window.location.hostname
      connectAuthEmulator(getAuth(app), `http://${host}:${emulatorPorts.auth}`, {
        disableWarnings: true,
      })
      connectFirestoreEmulator(getFirestore(app), host, emulatorPorts.firestore)
      connectStorageEmulator(getStorage(app), host, emulatorPorts.storage)
    }
  }
  return app
}

export function getFirebaseAuth(): Auth {
  auth ??= getAuth(getFirebaseApp())
  return auth
}

export function getDb(): Firestore {
  db ??= getFirestore(getFirebaseApp())
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  storage ??= getStorage(getFirebaseApp())
  return storage
}
