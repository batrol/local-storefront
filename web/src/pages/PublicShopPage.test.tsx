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
      <Route path="/loja/:slug" element={<PublicShopPage />} />
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
    renderWithProviders(ui(), '/loja/mercearia')

    expect(await screen.findByText('Mercearia Central')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled()

    const add = screen.getByRole('button', { name: 'Adicionar' })
    await userEvent.click(add)
    await userEvent.click(add)
    expect(screen.getByText(/Total:.*51,80/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Seu nome'), 'Maria')
    await userEvent.type(screen.getByLabelText('Telefone / WhatsApp'), '11988887777')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido' }))

    expect(await screen.findByText('Pedido enviado!')).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(String(post[1]?.body))).toMatchObject({
      customer_name: 'Maria',
      fulfillment: 'pickup',
      items: [{ product_id: 1, quantity: 2 }],
    })
  })

  it('asks for the address when delivery is selected', async () => {
    mockFetch((url) => (url.endsWith('/products') ? { data: products } : { data: shop }))
    renderWithProviders(ui(), '/loja/mercearia')
    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar' }))
    expect(screen.queryByLabelText('Endereço de entrega')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Entrega'))
    expect(screen.getByLabelText('Endereço de entrega')).toBeInTheDocument()
  })

  it('shows a message for an unknown shop', async () => {
    mockFetch(() => ({ message: 'Not found' }), 404)
    renderWithProviders(ui(), '/loja/nada')
    await waitFor(() => expect(screen.getByText('Loja não encontrada.')).toBeInTheDocument())
  })
})
