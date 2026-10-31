import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './apiClient'
import type { Category, Order, OrderStatus, Product, PublicProduct, Shop } from './types'

type List<T> = { data: T[] }
type One<T> = { data: T }

export interface ProductInput {
  name: string
  description?: string | null
  price_cents: number
  stock?: number
  category_id?: number | null
  active?: boolean
}

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api<List<Category>>('GET', '/categories').then((r) => r.data) })

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api<One<Category>>('POST', '/categories', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: () => api<List<Product>>('GET', '/products').then((r) => r.data) })

export function useSaveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ProductInput }) =>
      id
        ? api<One<Product>>('PUT', `/products/${id}`, { ...input })
        : api<One<Product>>('POST', '/products', { ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api('DELETE', `/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: number; delta: number; reason: string }) =>
      api<One<Product>>('POST', `/products/${id}/stock`, { delta, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useOrders = (status?: OrderStatus) =>
  useQuery({
    queryKey: ['orders', status ?? 'all'],
    queryFn: () => api<List<Order>>('GET', `/orders${status ? `?status=${status}` : ''}`).then((r) => r.data),
  })

export function useSetOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      api<One<Order>>('PATCH', `/orders/${id}/status`, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export const usePublicShop = (slug: string) =>
  useQuery({ queryKey: ['shop', slug], queryFn: () => api<One<Shop>>('GET', `/shops/${slug}`).then((r) => r.data) })

export const usePublicProducts = (slug: string) =>
  useQuery({
    queryKey: ['shop', slug, 'products'],
    queryFn: () => api<List<PublicProduct>>('GET', `/shops/${slug}/products`).then((r) => r.data),
  })
