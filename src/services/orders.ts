import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { buildBill } from '../config/billing'
import { storagePathToUrl } from '../lib/storage'
import type { Address, CartLine, Order, OrderItem } from '../types'

const ORDERS = 'orders'

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date()
}

function mapOrder(id: string, data: DocumentData): Order {
  return {
    id,
    userId: String(data.userId ?? ''),
    restaurantId: String(data.restaurantId ?? ''),
    restaurantName: String(data.restaurantName ?? ''),
    restaurantImage: storagePathToUrl(data.restaurantImage),
    items: (data.items ?? []) as OrderItem[],
    address: data.address as Address,
    subtotal: Number(data.subtotal ?? 0),
    deliveryFee: Number(data.deliveryFee ?? 0),
    taxes: Number(data.taxes ?? 0),
    total: Number(data.total ?? 0),
    paymentMode: (data.paymentMode ?? 'COD') as Order['paymentMode'],
    status: data.status ?? 'placed',
    placedAt: toDate(data.placedAt),
  }
}

export interface PlaceOrderInput {
  userId: string
  restaurantId: string
  restaurantName: string
  restaurantImage: string
  lines: CartLine[]
  address: Address
  paymentMode: Order['paymentMode']
}

export async function placeOrder(input: PlaceOrderInput): Promise<string> {
  const subtotal = input.lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const bill = buildBill(subtotal)
  const items: OrderItem[] = input.lines.map((line) => ({
    menuItemId: line.menuItemId,
    name: line.name,
    price: line.price,
    quantity: line.quantity,
    isVeg: line.isVeg,
  }))

  const ref = await addDoc(collection(getDb(), ORDERS), {
    userId: input.userId,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    restaurantImage: input.restaurantImage,
    items,
    address: input.address,
    ...bill,
    paymentMode: input.paymentMode,
    status: 'placed',
    placedAt: serverTimestamp(),
  })
  return ref.id
}

/** Users may only ever read/cancel their own orders (enforced by Firestore rules too). */
export function subscribeToMyOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), ORDERS), where('userId', '==', userId), orderBy('placedAt', 'desc')),
    (snapshot: QuerySnapshot<DocumentData>) => {
      onData(snapshot.docs.map((snapshotDoc) => mapOrder(snapshotDoc.id, snapshotDoc.data())))
    },
    (error) => onError(error),
  )
}

export async function listMyOrders(userId: string): Promise<Order[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), ORDERS), where('userId', '==', userId), orderBy('placedAt', 'desc')),
  )
  return snapshot.docs.map((snapshotDoc) => mapOrder(snapshotDoc.id, snapshotDoc.data()))
}

export async function cancelOrder(orderId: string): Promise<void> {
  await updateDoc(doc(getDb(), ORDERS, orderId), { status: 'cancelled' })
}

/* ---------------------------------------------------------------- admin */

/** Every order in the project — allowed by rules for the `admin` claim. */
export function subscribeToAllOrders(
  onData: (orders: Order[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), ORDERS), orderBy('placedAt', 'desc')),
    (snapshot: QuerySnapshot<DocumentData>) => {
      onData(snapshot.docs.map((item) => mapOrder(item.id, item.data())))
    },
    (error) => onError(error),
  )
}

export async function setOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(getDb(), ORDERS, orderId), { status })
}
