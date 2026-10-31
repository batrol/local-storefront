import { tokenStore } from '@/lib/apiClient'
import { mockFetch, renderWithProviders } from '@/test/render'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProductsPage } from './ProductsPage'

const product = {
  id: 3, name: 'Cabo USB', description: null, price_cents: 1990, stock: 2, low_stock_threshold: 5,
  low_stock: true, active: true, image_url: null, category: null,
}

describe('ProductsPage', () => {
  it('shows the low-stock badge and sends a stock adjustment', async () => {
    tokenStore.set('tok')
    const fetchMock = mockFetch((url, init) => {
      if (url.includes('/stock') && init?.method === 'POST') return { data: { ...product, stock: 3 } }
      if (url.endsWith('/categories')) return { data: [] }
      if (url.endsWith('/me')) return { data: { id: 1, name: 'Ana', email: 'a@b.co', shop: {} } }
      return { data: [product] }
    })
    renderWithProviders(<ProductsPage />)

    expect(await screen.findByText('Cabo USB')).toBeInTheDocument()
    expect(screen.getByText('Estoque baixo')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar estoque de Cabo USB' }))
    const call = fetchMock.mock.calls.find(([u]) => String(u).includes('/products/3/stock'))!
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({ delta: 1 })
  })

  it('rejects an invalid price before calling the API', async () => {
    mockFetch((url) => (url.endsWith('/categories') ? { data: [] } : { data: [] }))
    renderWithProviders(<ProductsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Novo produto' }))
    await userEvent.type(screen.getByLabelText('Nome do produto'), 'Teste')
    await userEvent.type(screen.getByLabelText('Preço (R$)'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Preço inválido')
  })
})
