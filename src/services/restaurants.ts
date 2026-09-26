import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  documentId,
  serverTimestamp,
  updateDoc,
  type QueryConstraint,
  type Unsubscribe,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storagePathToUrl } from '../lib/storage'
import type { Address, Restaurant } from '../types'

const RESTAURANTS = 'restaurants'

export interface RestaurantFilters {
  search?: string
  cuisine?: string
  maxPrice?: number
  vegOnly?: boolean
  sort?: 'rating' | 'delivery' | 'cost_low' | 'cost_high'
  limit?: number
}

const SORTERS: Record<NonNullable<RestaurantFilters['sort']>, QueryConstraint[]> = {
  rating: [orderBy('rating', 'desc')],
  delivery: [orderBy('deliveryTime', 'asc')],
  cost_low: [orderBy('priceForTwo', 'asc')],
  cost_high: [orderBy('priceForTwo', 'desc')],
}

function buildQuery(filters: RestaurantFilters) {
  const constraints: QueryConstraint[] = []
  // Only the cuisine filter runs in Firestore — it is the one users combine
  // with every sort order, and it needs a single composite index per sort.
  if (filters.cuisine) constraints.push(where('cuisines', 'array-contains', filters.cuisine))
  constraints.push(...(SORTERS[filters.sort ?? 'rating'] ?? SORTERS.rating))
  if (filters.limit) constraints.push(limit(filters.limit))
  return query(collection(getDb(), RESTAURANTS), ...constraints)
}

function mapRestaurant(id: string, data: DocumentData): Restaurant {
  return {
    id,
    name: String(data.name ?? 'Unknown'),
    cuisines: Array.isArray(data.cuisines) ? (data.cuisines as string[]) : [],
    rating: Number(data.rating ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    priceForTwo: Number(data.priceForTwo ?? 0),
    deliveryTime: Number(data.deliveryTime ?? 0),
    coverImage: storagePathToUrl(data.coverImage),
    bannerImage: storagePathToUrl(data.bannerImage),
    address: (data.address ?? { line1: '', city: '', pincode: '' }) as Address,
    vegOnly: Boolean(data.vegOnly),
    offer: data.offer ? String(data.offer) : undefined,
    isOpen: data.isOpen !== false,
  }
}

/** Client-side text search: the dataset is small and Firestore has no LIKE operator. */
function matchesSearch(restaurant: Restaurant, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  const haystack = [restaurant.name, restaurant.address.city, ...restaurant.cuisines]
    .join(' ')
    .toLowerCase()
  return needle.split(/\s+/).every((token) => haystack.includes(token))
}

/** Price and diet filters stay client-side so only one composite index per sort is needed. */
function applyClientFilters(restaurants: Restaurant[], filters: RestaurantFilters): Restaurant[] {
  return restaurants.filter((restaurant) => {
    if (filters.vegOnly && !restaurant.vegOnly) return false
    if (filters.maxPrice && restaurant.priceForTwo > filters.maxPrice) return false
    return matchesSearch(restaurant, filters.search ?? '')
  })
}

/** Live restaurant list. Returns the unsubscribe function. */
export function subscribeToRestaurants(
  filters: RestaurantFilters,
  onData: (restaurants: Restaurant[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    buildQuery(filters),
    (snapshot: QuerySnapshot<DocumentData>) => {
      const restaurants = snapshot.docs.map((doc) => mapRestaurant(doc.id, doc.data()))
      onData(applyClientFilters(restaurants, filters))
    },
    (error) => onError(error),
  )
}

export async function listRestaurants(filters: RestaurantFilters = {}): Promise<Restaurant[]> {
  const snapshot = await getDocs(buildQuery(filters))
  const restaurants = snapshot.docs.map((doc) => mapRestaurant(doc.id, doc.data()))
  return applyClientFilters(restaurants, filters)
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const snapshot = await getDocs(
    query(collection(getDb(), RESTAURANTS), where(documentId(), '==', id), limit(1)),
  )
  if (snapshot.empty) return null
  return mapRestaurant(snapshot.docs[0].id, snapshot.docs[0].data())
}

export async function listCuisines(): Promise<string[]> {
  const restaurants = await listRestaurants()
  const cuisines = new Set<string>()
  restaurants.forEach((restaurant) => restaurant.cuisines.forEach((c) => cuisines.add(c)))
  return [...cuisines].sort((a, b) => a.localeCompare(b))
}

/* ---------------------------------------------------------------- admin */

export type RestaurantInput = Omit<Restaurant, 'id' | 'coverImage' | 'bannerImage'> & {
  coverImage?: string
  bannerImage?: string
}

/** Firestore rejects `undefined`, so partial updates must drop absent keys. */
const definedOnly = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>

const toDocument = (input: RestaurantInput) => ({
  name: input.name,
  cuisines: input.cuisines,
  rating: input.rating,
  ratingCount: input.ratingCount,
  priceForTwo: input.priceForTwo,
  deliveryTime: input.deliveryTime,
  address: input.address,
  vegOnly: input.vegOnly,
  offer: input.offer ?? null,
  isOpen: input.isOpen,
  ...(input.coverImage ? { coverImage: input.coverImage } : {}),
  ...(input.bannerImage ? { bannerImage: input.bannerImage } : {}),
})

/** Admin only (enforced by firestore.rules through the `admin` custom claim). */
export async function createRestaurant(input: RestaurantInput): Promise<string> {
  const ref = await addDoc(collection(getDb(), RESTAURANTS), {
    ...toDocument(input),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRestaurant(
  id: string,
  patch: Partial<RestaurantInput>,
): Promise<void> {
  await updateDoc(doc(getDb(), RESTAURANTS, id), {
    ...definedOnly(patch),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRestaurant(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), RESTAURANTS, id))
}

export async function countRestaurants(): Promise<number> {
  const snapshot = await getCountFromServer(collection(getDb(), RESTAURANTS))
  return snapshot.data().count
}

export { RESTAURANTS }
