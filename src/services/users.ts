import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getDb, getFirebaseStorage } from '../lib/firebase'
import { USER_AVATAR_PATH } from '../lib/storage'
import type { Address, UserProfile } from '../types'

const USERS = 'users'

function mapProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    phone: data.phone ? String(data.phone) : undefined,
    avatar: data.avatar ? String(data.avatar) : undefined,
    addresses: Array.isArray(data.addresses) ? (data.addresses as Address[]) : [],
  }
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getDb(), USERS, uid))
  return snapshot.exists() ? mapProfile(uid, snapshot.data()) : null
}

export function subscribeToProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(getDb(), USERS, uid), (snapshot) => {
    onData(snapshot.exists() ? mapProfile(uid, snapshot.data()) : null)
  })
}

export interface CreateProfileInput {
  uid: string
  name: string
  email: string
  phone?: string
}

export async function createProfile(input: CreateProfileInput): Promise<void> {
  await setDoc(
    doc(getDb(), USERS, input.uid),
    {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      addresses: [],
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function addAddress(uid: string, address: Address): Promise<void> {
  const profile = await getProfile(uid)
  const addresses = [...(profile?.addresses ?? []), address]
  await updateDoc(doc(getDb(), USERS, uid), { addresses })
}

export async function removeAddress(uid: string, index: number): Promise<void> {
  const profile = await getProfile(uid)
  const addresses = (profile?.addresses ?? []).filter((_, i) => i !== index)
  await updateDoc(doc(getDb(), USERS, uid), { addresses })
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

/** Uploads the signed-in user's avatar to Firebase Storage and stores its download URL. */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > MAX_AVATAR_BYTES) throw new Error('Image must be smaller than 2 MB.')

  const storageRef = ref(getFirebaseStorage(), USER_AVATAR_PATH(uid))
  await uploadBytes(storageRef, file, { contentType: file.type })
  const url = await getDownloadURL(storageRef)
  await updateDoc(doc(getDb(), USERS, uid), { avatar: url })
  return url
}
