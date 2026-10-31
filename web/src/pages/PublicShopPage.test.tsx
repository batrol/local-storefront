import { mockFetch, renderWithProviders } from '@/test/render'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PublicShopPage } from './PublicShopPage'

const shop = { id: 1, name: 'Mercearia Central', slug: 'mercearia', phone: '(11) 99999-0000' }
const products = [
  { id: 1, name: 'Arroz 5kg', description: null, price_cents: 2590, image_url: null, in_stock: true, category: null },
  { id: 2, name: 'Feijão 1kg', description: null, price_cents: 899, image_url: null, in_stock: false, category: null },
]

function ui() {
  return (
    <Routes>
      <Route path="/shop/:slug" element={<PublicShopPage />} />
    </Routes>
  )
}

describe('PublicShopPage', () => {
  it('lists products, disables out-of-stock and places an order', async () => {
    const fetchMock = mockFetch((url, init) => {
      if (init?.method === 'POST') return { data: { id: 7, total_cents: 5180 } }
      if (url.endsWith('/products')) return { data: products }
      return { data: shop }
    })
    renderWithProviders(ui(), '/shop/mercearia')

    expect(await screen.findByText('Mercearia Central')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled()

    const add = screen.getByRole('button', { name: 'Add' })
    await userEvent.click(add)
    await userEvent.click(add)
    expect(screen.getByText(/Total:.*51\.80/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Your name'), 'Maria')
    await userEvent.type(screen.getByLabelText('Phone / WhatsApp'), '11988887777')
    await userEvent.click(screen.getByRole('button', { name: 'Send order' }))

    expect(await screen.findByText('Order sent!')).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(String(post[1]?.body))).toMatchObject({
      customer_name: 'Maria',
      fulfillment: 'pickup',
      items: [{ product_id: 1, quantity: 2 }],
    })
  })

  it('asks for the address when delivery is selected', async () => {
    mockFetch((url) => (url.endsWith('/products') ? { data: products } : { data: shop }))
    renderWithProviders(ui(), '/shop/mercearia')
    await userEvent.click(await screen.findByRole('button', { name: 'Add' }))
    expect(screen.queryByLabelText('Delivery address')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Delivery'))
    expect(screen.getByLabelText('Delivery address')).toBeInTheDocument()
  })

  it('shows a message for an unknown shop', async () => {
    mockFetch(() => ({ message: 'Not found' }), 404)
    renderWithProviders(ui(), '/shop/nada')
    await waitFor(() => expect(screen.getByText('Shop not found.')).toBeInTheDocument())
  })
})
