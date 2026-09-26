/** Money in whole rupees: 249 -> "₹249" */
export function formatPrice(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatPriceForTwo(value: number): string {
  return `₹${value} for two`
}

export function priceRange(priceForTwo: number): string {
  if (priceForTwo <= 300) return '₹'
  if (priceForTwo <= 600) return '₹₹'
  return '₹₹₹'
}

export function formatDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: 'Order placed',
  preparing: 'Preparing your food',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
