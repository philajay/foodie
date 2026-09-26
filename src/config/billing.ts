export const DELIVERY_FEE = 29
export const TAX_RATE = 0.05
export const FREE_DELIVERY_ABOVE = 499
export const ORDER_STATUS_FLOW = [
  'placed',
  'preparing',
  'out_for_delivery',
  'delivered',
] as const

export interface BillSummary {
  subtotal: number
  deliveryFee: number
  taxes: number
  total: number
}

export function buildBill(subtotal: number): BillSummary {
  const taxes = Math.round(subtotal * TAX_RATE)
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE
  return { subtotal, deliveryFee, taxes, total: subtotal + taxes + deliveryFee }
}
