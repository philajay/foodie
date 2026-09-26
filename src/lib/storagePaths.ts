/**
 * Storage layout, shared by the app and the seed script.
 * Keep this module free of any Firebase imports so Node scripts can use it too.
 *
 * Extensions are parameters because a restaurant may use generated `.svg`
 * placeholders or real `.jpg` photography — the Firestore document must always
 * store the path of the object that actually exists in Storage.
 */
const EXT = (ext: string) => (ext.startsWith('.') ? ext.slice(1) : ext)

export const RESTAURANT_COVER_PATH = (restaurantId: string, ext = 'svg') =>
  `restaurants/${restaurantId}/cover.${EXT(ext)}`

export const RESTAURANT_BANNER_PATH = (restaurantId: string, ext = 'svg') =>
  `restaurants/${restaurantId}/banner.${EXT(ext)}`

export const MENU_ITEM_IMAGE_PATH = (restaurantId: string, itemId: string, ext = 'svg') =>
  `restaurants/${restaurantId}/menu/${itemId}.${EXT(ext)}`

export const USER_AVATAR_PATH = (uid: string) => `users/${uid}/avatar`

export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f1f2f6"/><text x="200" y="155" font-family="sans-serif" font-size="18" fill="#8b90a0" text-anchor="middle">No image</text></svg>`,
  )
