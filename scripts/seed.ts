import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import type { Storage } from 'firebase-admin/storage'
import { renderSvg, BANNER_SIZE, COVER_SIZE, DISH_SIZE } from '../seed/images'
import { firestore, projectId, storage, usesEmulators } from '../seed/firebase-admin'
import { SEED_RESTAURANTS, type SeedRestaurant } from '../seed/restaurants'
import {
  MENU_ITEM_IMAGE_PATH,
  RESTAURANT_BANNER_PATH,
  RESTAURANT_COVER_PATH,
} from '../src/lib/storagePaths'

const RESTAURANTS = 'restaurants'
const LOG = (message: string) => console.log(message)
const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
}
const contentTypeOf = (file: string) => CONTENT_TYPES[extname(file).slice(1).toLowerCase()] ?? 'image/jpeg'
const extensionOf = (file: string) => extname(file).slice(1).toLowerCase()

interface UploadResult {
  uploaded: number
  skipped: number
  coverImage: string
  bannerImage: string
  /** Storage path per menu item id. */
  menuImages: Record<string, string>
}

/**
 * Images live in Cloud Storage. If you drop real photos into
 * `seed-images/<restaurantId>/` they are uploaded as-is and their real
 * extension is stored in Firestore; otherwise a generated SVG placeholder is
 * uploaded. Returns the paths that were actually written.
 */
async function uploadImagesForRestaurant(
  bucket: ReturnType<Storage['bucket']>,
  restaurant: SeedRestaurant,
  customImagesDir: string,
  shouldOverwrite: boolean,
): Promise<UploadResult> {
  let uploaded = 0
  let skipped = 0

  const put = async (path: string, data: Buffer, contentType: string) => {
    const file = bucket.file(path)
    if (!shouldOverwrite && (await file.exists())[0]) {
      skipped += 1
      return
    }
    await file.save(data, { contentType, metadata: { cacheControl: 'public,max-age=31536000' } })
    uploaded += 1
  }

  const localDir = join(customImagesDir, restaurant.id)
  const localFiles = existsSync(localDir)
    ? (await readdir(localDir)).filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
    : []

  const findLocal = (match: (name: string) => boolean) =>
    localFiles.find((name) => match(basename(name, extname(name))))

  const coverLocal = findLocal((name) => name.toLowerCase() === 'cover')
  const bannerLocal = findLocal((name) => name.toLowerCase() === 'banner')

  const coverExt = coverLocal ? extensionOf(coverLocal) : 'svg'
  const bannerExt = bannerLocal ? extensionOf(bannerLocal) : 'svg'
  const coverImage = RESTAURANT_COVER_PATH(restaurant.id, coverExt)
  const bannerImage = RESTAURANT_BANNER_PATH(restaurant.id, bannerExt)

  if (coverLocal) {
    await put(coverImage, await readFile(join(localDir, coverLocal)), contentTypeOf(coverLocal))
  } else {
    await put(
      coverImage,
      renderSvg({
        title: restaurant.name,
        emoji: restaurant.emoji,
        theme: restaurant.theme,
        badge: restaurant.offer,
        ...COVER_SIZE,
      }),
      'image/svg+xml',
    )
  }

  if (bannerLocal) {
    await put(bannerImage, await readFile(join(localDir, bannerLocal)), contentTypeOf(bannerLocal))
  } else {
    await put(
      bannerImage,
      renderSvg({
        title: restaurant.name,
        emoji: restaurant.emoji,
        theme: restaurant.theme,
        ...BANNER_SIZE,
      }),
      'image/svg+xml',
    )
  }

  const menuImages: Record<string, string> = {}

  for (const item of restaurant.menu) {
    const localDish = findLocal((name) => name.toLowerCase() === item.id.toLowerCase())
    if (localDish) {
      const path = MENU_ITEM_IMAGE_PATH(restaurant.id, item.id, extensionOf(localDish))
      await put(path, await readFile(join(localDir, localDish)), contentTypeOf(localDish))
      menuImages[item.id] = path
      continue
    }
    const path = MENU_ITEM_IMAGE_PATH(restaurant.id, item.id)
    await put(
      path,
      renderSvg({ title: item.name, emoji: item.emoji, theme: restaurant.theme, ...DISH_SIZE }),
      'image/svg+xml',
    )
    menuImages[item.id] = path
  }

  return { uploaded, skipped, coverImage, bannerImage, menuImages }
}

async function main() {
  const shouldOverwrite = process.argv.includes('--force')
  const shouldReset = process.argv.includes('--reset')
  const customImagesDir = process.env.SEED_IMAGES_DIR ?? 'seed-images'

  const db = firestore()
  const bucket = storage().bucket()

  LOG(`\nSeeding project: ${projectId}${usesEmulators ? ' (emulators)' : ''}\n`)

  if (shouldReset) {
    LOG('• --reset: deleting existing restaurants collection…')
    const snapshot = await db.collection(RESTAURANTS).get()
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        await db.recursiveDelete(doc.ref)
        await bucket.deleteFiles({ prefix: `restaurants/${doc.id}/` })
      }),
    )
  }

  let totalUploaded = 0
  let totalSkipped = 0

  for (const restaurant of SEED_RESTAURANTS) {
    const { theme, emoji, menu, ...document } = restaurant
    void theme
    void emoji

    const result = await uploadImagesForRestaurant(
      bucket,
      restaurant,
      customImagesDir,
      shouldOverwrite,
    )
    totalUploaded += result.uploaded
    totalSkipped += result.skipped

    const restaurantRef = db.collection(RESTAURANTS).doc(restaurant.id)
    const batch = db.batch()
    batch.set(restaurantRef, {
      ...document,
      coverImage: result.coverImage,
      bannerImage: result.bannerImage,
      updatedAt: new Date(),
    })

    for (const item of menu) {
      batch.set(restaurantRef.collection('menu').doc(item.id), {
        name: item.name,
        description: item.description,
        price: item.price,
        isVeg: item.isVeg,
        category: item.category,
        image: result.menuImages[item.id],
        inStock: true,
        ...(item.rating ? { rating: item.rating } : {}),
      })
    }

    await batch.commit()
    LOG(`• ${restaurant.name.padEnd(20)} ${menu.length} dishes, ${result.uploaded} images`)
  }

  LOG(
    `\nDone. ${SEED_RESTAURANTS.length} restaurants, ${totalUploaded} images uploaded, ${totalSkipped} already present.`,
  )
  LOG('Run `npm run dev` and open the printed app URL.\n')
}

main().catch((error: unknown) => {
  console.error('\nSeed failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
