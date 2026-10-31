import { Card, ErrorText, GhostButton } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { useOrders, useSetOrderStatus } from '@/lib/hooks'
import { formatCents } from '@/lib/money'
import type { Order, OrderStatus } from '@/lib/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation()
  const setStatus = useSetOrderStatus()
  const [error, setError] = useState('')

  const change = async (status: OrderStatus) => {
    try {
      await setStatus.mutateAsync({ id: order.id, status })
      setError('')
    } catch (e) {
      setError(firstError(e))
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-semibold">{t('orders.heading', { id: order.id, name: order.customer_name })}</p>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{t(`orders.status.${order.status}`)}</span>
      </div>
      <p className="text-sm text-slate-600">
        {order.customer_phone} ·{' '}
        {order.fulfillment === 'delivery' ? t('orders.delivery', { address: order.address }) : t('orders.pickup')}
      </p>
      <ul className="my-2 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            {i.quantity}× {i.name} — {formatCents(i.unit_price_cents * i.quantity)}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mb-2 text-sm italic">“{order.notes}”</p>}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-bold">{formatCents(order.total_cents)}</p>
        {NEXT[order.status].map((next) => (
          <GhostButton key={next} onClick={() => void change(next)} disabled={setStatus.isPending}>
            {t(`orders.action.${next}`)}
          </GhostButton>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
    </Card>
  )
}

export function OrdersPage() {
  const { t } = useTranslation()
  const orders = useOrders()

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t('orders.title')}</h2>
      {orders.isLoading && <p className="text-slate-500">{t('common.loading')}</p>}
      {orders.data?.length === 0 && <p className="text-slate-500">{t('orders.empty')}</p>}
      {orders.data?.map((o) => <OrderCard key={o.id} order={o} />)}
    </div>
  )
}
