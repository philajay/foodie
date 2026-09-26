import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  serverTimestamp,
  setDoc,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storagePathToUrl } from '../lib/storage'
import type { MenuItem } from '../types'

function mapMenuItem(restaurantId: string, id: string, data: DocumentData): MenuItem {
  return {
    id,
    restaurantId,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    isVeg: Boolean(data.isVeg),
    category: (data.category ?? 'Recommended') as MenuItem['category'],
    image: storagePathToUrl(data.image),
    inStock: data.inStock !== false,
    rating: data.rating ? Number(data.rating) : undefined,
  }
}

export function menuCollection(restaurantId: string) {
  return collection(getDb(), 'restaurants', restaurantId, 'menu')
}

export function subscribeToMenu(
  restaurantId: string,
  onData: (items: MenuItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(menuCollection(restaurantId), orderBy('category')),
    (snapshot: QuerySnapshot<DocumentData>) => {
      onData(snapshot.docs.map((doc) => mapMenuItem(restaurantId, doc.id, doc.data())))
    },
    (error) => onError(error),
  )
}

export async function listMenu(restaurantId: string): Promise<MenuItem[]> {
  const snapshot = await getDocs(query(menuCollection(restaurantId)))
  return snapshot.docs.map((doc) => mapMenuItem(restaurantId, doc.id, doc.data()))
}

/* ---------------------------------------------------------------- admin */

export type MenuItemInput = Omit<MenuItem, 'id' | 'restaurantId'> & { id?: string }

export async function saveMenuItem(restaurantId: string, input: MenuItemInput): Promise<void> {
  const ref = input.id
    ? doc(getDb(), 'restaurants', restaurantId, 'menu', input.id)
    : doc(collection(getDb(), 'restaurants', restaurantId, 'menu'))
  const payload = {
    name: input.name,
    description: input.description,
    price: input.price,
    isVeg: input.isVeg,
    category: input.category,
    image: input.image,
    inStock: input.inStock,
    ...(input.rating ? { rating: input.rating } : {}),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
}

export async function deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'restaurants', restaurantId, 'menu', itemId))
}

export async function countMenuItems(restaurantId: string): Promise<number> {
  const snapshot = await getCountFromServer(menuCollection(restaurantId))
  return snapshot.data().count
}

export const MENU_CATEGORY_ORDER = [
  'Recommended',
  'Starters',
  'Main Course',
  'Desserts',
  'Beverages',
] as const
