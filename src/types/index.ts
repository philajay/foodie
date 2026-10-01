export type Cuisine = string

export interface Restaurant {
  id: string
  name: string
  cuisines: Cuisine[]
  rating: number
  ratingCount: number
  /** Rupees, for two people. */
  priceForTwo: number
  /** Minutes. */
  deliveryTime: number
  coverImage: string
  bannerImage: string
  address: Address
  vegOnly: boolean
  offer?: string
  isOpen: boolean
}

export type MenuCategory = 'Recommended' | 'Starters' | 'Main Course' | 'Desserts' | 'Beverages'

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string
  price: number
  isVeg: boolean
  category: MenuCategory
  image: string
  inStock: boolean
  rating?: number
  /** Demo hardcoded field: total times ordered. Higher = more sold. */
  soldCount?: number
}

export interface Address {
  label: string
  line1: string
  city: string
  pincode: string
}

export interface CartLine {
  menuItemId: string
  restaurantId: string
  restaurantName: string
  name: string
  price: number
  isVeg: boolean
  image: string
  quantity: number
}

export type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  isVeg: boolean
}

export interface Order {
  id: string
  userId: string
  restaurantId: string
  restaurantName: string
  restaurantImage: string
  items: OrderItem[]
  address: Address
  subtotal: number
  deliveryFee: number
  taxes: number
  total: number
  paymentMode: 'COD' | 'UPI'
  status: OrderStatus
  placedAt: Date
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  phone?: string
  avatar?: string
  addresses: Address[]
}
