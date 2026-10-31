import { Button, Card, ErrorText, Field, GhostButton } from '@/components/ui'
import { api, firstError } from '@/lib/apiClient'
import { addToCart, cartItems, cartTotal, setQuantity, type Cart } from '@/lib/cart'
import { usePublicProducts, usePublicShop } from '@/lib/hooks'
import { formatCents } from '@/lib/money'
import type { Fulfillment, Order } from '@/lib/types'
import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'

export function PublicShopPage() {
  const { slug = '' } = useParams()
  const shop = usePublicShop(slug)
  const products = usePublicProducts(slug)
  const [cart, setCart] = useState<Cart>({})
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState<Order | null>(null)

  if (shop.isError) return <p className="p-6">Loja não encontrada.</p>
  if (shop.isLoading || products.isLoading) return <p className="p-6 text-slate-500">Carregando…</p>

  const list = products.data ?? []
  const total = cartTotal(cart, list)
  const inCart = list.filter((p) => cart[p.id])

  if (placed) {
    return (
      <main className="mx-auto mt-16 max-w-md p-4">
        <Card>
          <h1 className="text-xl font-bold">Pedido enviado!</h1>
          <p className="mt-2">
            Seu pedido #{placed.id} foi enviado para {shop.data?.name}. Total: {formatCents(placed.total_cents)}.
          </p>
          <p className="mt-1 text-sm text-slate-600">A loja entrará em contato pelo telefone informado.</p>
        </Card>
      </main>
    )
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try {
      const res = await api<{ data: Order }>('POST', `/shops/${slug}/orders`, {
        customer_name: String(f.get('name')),
        customer_phone: String(f.get('phone')),
        fulfillment,
        address: fulfillment === 'delivery' ? String(f.get('address')) : null,
        notes: String(f.get('notes') || '') || null,
        items: cartItems(cart),
      })
      setPlaced(res.data)
    } catch (err) {
      setError(firstError(err))
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-1 text-2xl font-bold">{shop.data?.name}</h1>
      {shop.data?.phone && <p className="mb-4 text-sm text-slate-600">Contato: {shop.data.phone}</p>}

      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col">
              <p className="font-medium">{p.name}</p>
              {p.description && <p className="text-sm text-slate-600">{p.description}</p>}
              <p className="mt-auto pt-2 font-bold">{formatCents(p.price_cents)}</p>
              <Button className="mt-2" disabled={!p.in_stock} onClick={() => setCart((c) => addToCart(c, p.id))}>
                {p.in_stock ? 'Adicionar' : 'Esgotado'}
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="text-slate-500">Esta loja ainda não tem produtos.</p>}

      {inCart.length > 0 && (
        <section aria-label="Carrinho" className="mt-6">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">Seu pedido</h2>
            <ul className="mb-3 space-y-1 text-sm">
              {inCart.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="mr-auto">{p.name}</span>
                  <GhostButton aria-label={`Menos ${p.name}`} onClick={() => setCart((c) => setQuantity(c, p.id, (c[p.id] ?? 0) - 1))}>−</GhostButton>
                  <span className="w-6 text-center">{cart[p.id]}</span>
                  <GhostButton aria-label={`Mais ${p.name}`} onClick={() => setCart((c) => addToCart(c, p.id))}>+</GhostButton>
                </li>
              ))}
            </ul>
            <p className="mb-3 font-bold">Total: {formatCents(total)}</p>

            <form onSubmit={submit} className="space-y-3">
              <Field label="Seu nome" name="name" required />
              <Field label="Telefone / WhatsApp" name="phone" type="tel" required />
              <fieldset className="flex gap-4 text-sm">
                <legend className="mb-1 font-medium">Como receber</legend>
                <label><input type="radio" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /> Retirar na loja</label>
                <label><input type="radio" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /> Entrega</label>
              </fieldset>
              {fulfillment === 'delivery' && <Field label="Endereço de entrega" name="address" required />}
              <Field label="Observações" name="notes" />
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full">Enviar pedido</Button>
            </form>
          </Card>
        </section>
      )}
    </main>
  )
}
