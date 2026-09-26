import { getFirebaseStorage } from './firebase'
import { FALLBACK_IMAGE } from './storagePaths'

/**
 * Every image lives in Firebase Storage. Documents store only the storage
 * *path* (e.g. `restaurants/dominos/cover.svg`) so URLs can be re-signed or
 * migrated later without rewriting Firestore data.
 */
export function storagePathToUrl(path: string | undefined | null): string {
  if (!path) return FALLBACK_IMAGE
  if (/^https?:\/\//i.test(path)) return path
  return storageUrl(path)
}

export function storageUrl(path: string): string {
  const bucket = getFirebaseStorage().app.options.storageBucket
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeStoragePath(path)}?alt=media`
}

/**
 * The Storage REST API expects the whole object name percent-encoded, so the
 * path separators must become %2F as well. Encoding segment-by-segment (and
 * rejoining with "/") silently produces a 400 from the API.
 */
function encodeStoragePath(path: string): string {
  return encodeURIComponent(path)
}

export { FALLBACK_IMAGE }
export {
  MENU_ITEM_IMAGE_PATH,
  RESTAURANT_BANNER_PATH,
  RESTAURANT_COVER_PATH,
  USER_AVATAR_PATH,
} from './storagePaths'
