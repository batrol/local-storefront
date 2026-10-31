export interface Shop {
  id: number
  name: string
  slug: string
  phone: string | null
}

export interface User {
  id: number
  name: string
  email: string
  shop: Shop
}

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  price_cents: number
  stock: number
  low_stock_threshold: number
  low_stock: boolean
  active: boolean
  image_url: string | null
  category: Category | null
}

export interface PublicProduct {
  id: number
  name: string
  description: string | null
  price_cents: number
  image_url: string | null
  in_stock: boolean
  category: Category | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
export type Fulfillment = 'pickup' | 'delivery'

export interface OrderItem {
  product_id: number | null
  name: string
  unit_price_cents: number
  quantity: number
}

export interface Order {
  id: number
  status: OrderStatus
  customer_name: string
  customer_phone: string
  fulfillment: Fulfillment
  address: string | null
  notes: string | null
  total_cents: number
  created_at: string
  items: OrderItem[]
}
