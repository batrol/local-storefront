import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, Card, ErrorText, Field, GhostButton } from '@/components/ui'
import { api, firstError } from '@/lib/apiClient'
import { addToCart, cartItems, cartTotal, setQuantity, type Cart } from '@/lib/cart'
import { usePublicProducts, usePublicShop } from '@/lib/hooks'
import { formatCents } from '@/lib/money'
import type { Fulfillment, Order } from '@/lib/types'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

export function PublicShopPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const shop = usePublicShop(slug)
  const products = usePublicProducts(slug)
  const [cart, setCart] = useState<Cart>({})
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState<Order | null>(null)

  if (shop.isError) return <p className="p-6">{t('shop.notFound')}</p>
  if (shop.isLoading || products.isLoading) return <p className="p-6 text-slate-500">{t('common.loading')}</p>

  const list = products.data ?? []
  const total = cartTotal(cart, list)
  const inCart = list.filter((p) => cart[p.id])

  if (placed) {
    return (
      <main className="mx-auto mt-16 max-w-md p-4">
        <Card>
          <h1 className="text-xl font-bold">{t('shop.sentTitle')}</h1>
          <p className="mt-2">
            {t('shop.sentBody', { id: placed.id, shop: shop.data?.name, total: formatCents(placed.total_cents) })}
          </p>
          <p className="mt-1 text-sm text-slate-600">{t('shop.sentHint')}</p>
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
      <div className="mb-1 flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">{shop.data?.name}</h1>
        <LanguageSwitcher />
      </div>
      {shop.data?.phone && <p className="mb-4 text-sm text-slate-600">{t('shop.contact', { phone: shop.data.phone })}</p>}

      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col">
              <p className="font-medium">{p.name}</p>
              {p.description && <p className="text-sm text-slate-600">{p.description}</p>}
              <p className="mt-auto pt-2 font-bold">{formatCents(p.price_cents)}</p>
              <Button className="mt-2" disabled={!p.in_stock} onClick={() => setCart((c) => addToCart(c, p.id))}>
                {p.in_stock ? t('shop.add') : t('shop.soldOut')}
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="text-slate-500">{t('shop.noProducts')}</p>}

      {inCart.length > 0 && (
        <section aria-label={t('shop.cart')} className="mt-6">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">{t('shop.yourOrder')}</h2>
            <ul className="mb-3 space-y-1 text-sm">
              {inCart.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="mr-auto">{p.name}</span>
                  <GhostButton aria-label={t('shop.less', { name: p.name })} onClick={() => setCart((c) => setQuantity(c, p.id, (c[p.id] ?? 0) - 1))}>−</GhostButton>
                  <span className="w-6 text-center">{cart[p.id]}</span>
                  <GhostButton aria-label={t('shop.more', { name: p.name })} onClick={() => setCart((c) => addToCart(c, p.id))}>+</GhostButton>
                </li>
              ))}
            </ul>
            <p className="mb-3 font-bold">{t('shop.total', { total: formatCents(total) })}</p>

            <form onSubmit={submit} className="space-y-3">
              <Field label={t('shop.yourName')} name="name" required />
              <Field label={t('shop.phone')} name="phone" type="tel" required />
              <fieldset className="flex gap-4 text-sm">
                <legend className="mb-1 font-medium">{t('shop.howToReceive')}</legend>
                <label><input type="radio" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /> {t('shop.pickup')}</label>
                <label><input type="radio" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /> {t('shop.delivery')}</label>
              </fieldset>
              {fulfillment === 'delivery' && <Field label={t('shop.address')} name="address" required />}
              <Field label={t('shop.notes')} name="notes" />
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full">{t('shop.send')}</Button>
            </form>
          </Card>
        </section>
      )}
    </main>
  )
}
