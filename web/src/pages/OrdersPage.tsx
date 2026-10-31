import { Card, ErrorText, GhostButton } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { useOrders, useSetOrderStatus } from '@/lib/hooks'
import { formatCents } from '@/lib/money'
import type { Order, OrderStatus } from '@/lib/types'
import { useState } from 'react'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Novo',
  confirmed: 'Confirmado',
  ready: 'Pronto',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const NEXT: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending: [{ status: 'confirmed', label: 'Confirmar' }, { status: 'cancelled', label: 'Cancelar' }],
  confirmed: [{ status: 'ready', label: 'Marcar pronto' }, { status: 'cancelled', label: 'Cancelar' }],
  ready: [{ status: 'completed', label: 'Concluir' }, { status: 'cancelled', label: 'Cancelar' }],
  completed: [],
  cancelled: [],
}

function OrderCard({ order }: { order: Order }) {
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
        <p className="mr-auto font-semibold">
          Pedido #{order.id} · {order.customer_name}
        </p>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{STATUS_LABEL[order.status]}</span>
      </div>
      <p className="text-sm text-slate-600">
        {order.customer_phone} · {order.fulfillment === 'delivery' ? `Entrega: ${order.address}` : 'Retirada na loja'}
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
        {NEXT[order.status].map((n) => (
          <GhostButton key={n.status} onClick={() => void change(n.status)} disabled={setStatus.isPending}>
            {n.label}
          </GhostButton>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
    </Card>
  )
}

export function OrdersPage() {
  const orders = useOrders()

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Pedidos</h2>
      {orders.isLoading && <p className="text-slate-500">Carregando…</p>}
      {orders.data?.length === 0 && <p className="text-slate-500">Nenhum pedido ainda. Compartilhe o link da sua loja.</p>}
      {orders.data?.map((o) => <OrderCard key={o.id} order={o} />)}
    </div>
  )
}
