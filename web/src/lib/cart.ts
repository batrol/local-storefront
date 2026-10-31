import type { PublicProduct } from './types'

export type Cart = Record<number, number> // product id -> quantity

export function addToCart(cart: Cart, productId: number): Cart {
  return { ...cart, [productId]: (cart[productId] ?? 0) + 1 }
}

export function setQuantity(cart: Cart, productId: number, qty: number): Cart {
  const next = { ...cart }
  if (qty <= 0) delete next[productId]
  else next[productId] = qty
  return next
}

export function cartTotal(cart: Cart, products: PublicProduct[]): number {
  return products.reduce((sum, p) => sum + p.price_cents * (cart[p.id] ?? 0), 0)
}

export function cartItems(cart: Cart): { product_id: number; quantity: number }[] {
  return Object.entries(cart).map(([id, quantity]) => ({ product_id: Number(id), quantity }))
}
