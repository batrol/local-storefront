import { describe, expect, it } from 'vitest'
import { addToCart, cartItems, cartTotal, setQuantity } from './cart'
import type { PublicProduct } from './types'

const product = (id: number, price: number): PublicProduct => ({
  id,
  name: `p${id}`,
  description: null,
  price_cents: price,
  image_url: null,
  in_stock: true,
  category: null,
})

describe('cart', () => {
  it('adds, changes and removes quantities', () => {
    let cart = addToCart({}, 1)
    cart = addToCart(cart, 1)
    expect(cart).toEqual({ 1: 2 })
    cart = setQuantity(cart, 1, 5)
    expect(cart[1]).toBe(5)
    cart = setQuantity(cart, 1, 0)
    expect(cart).toEqual({})
  })

  it('computes total and API items', () => {
    const cart = { 1: 2, 2: 1 }
    expect(cartTotal(cart, [product(1, 1000), product(2, 550)])).toBe(2550)
    expect(cartItems(cart)).toEqual([
      { product_id: 1, quantity: 2 },
      { product_id: 2, quantity: 1 },
    ])
  })
})
