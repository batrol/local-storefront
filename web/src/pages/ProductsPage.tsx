import { Button, Card, ErrorText, Field, GhostButton } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { useAdjustStock, useCategories, useCreateCategory, useDeleteProduct, useProducts, useSaveProduct } from '@/lib/hooks'
import { formatCents, parseToCents } from '@/lib/money'
import type { Product } from '@/lib/types'
import { useState, type FormEvent } from 'react'

function ProductForm({ onDone }: { onDone: () => void }) {
  const categories = useCategories()
  const save = useSaveProduct()
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const price = parseToCents(String(f.get('price')))
    if (price === null) return setError('Preço inválido. Use o formato 19,90.')
    const categoryId = Number(f.get('category_id'))
    try {
      await save.mutateAsync({
        input: {
          name: String(f.get('name')),
          price_cents: price,
          stock: Number(f.get('stock') || 0),
          category_id: categoryId || null,
        },
      })
      setError('')
      onDone()
    } catch (err) {
      setError(firstError(err))
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do produto" name="name" required />
        <Field label="Preço (R$)" name="price" inputMode="decimal" placeholder="19,90" required />
        <Field label="Estoque inicial" name="stock" type="number" min={0} defaultValue={0} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Categoria</span>
          <select name="category_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">Sem categoria</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={save.isPending}>Salvar produto</Button>
            <GhostButton type="button" onClick={onDone}>Cancelar</GhostButton>
          </div>
        </div>
      </form>
    </Card>
  )
}

function StockControl({ product }: { product: Product }) {
  const adjust = useAdjustStock()
  const [error, setError] = useState('')

  const apply = async (delta: number) => {
    const reason = delta > 0 ? 'entrada manual' : 'saída manual'
    try {
      await adjust.mutateAsync({ id: product.id, delta, reason })
      setError('')
    } catch (e) {
      setError(firstError(e))
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <GhostButton aria-label={`Diminuir estoque de ${product.name}`} onClick={() => void apply(-1)} disabled={adjust.isPending}>−</GhostButton>
        <span className="w-10 text-center font-semibold" data-testid={`stock-${product.id}`}>{product.stock}</span>
        <GhostButton aria-label={`Aumentar estoque de ${product.name}`} onClick={() => void apply(1)} disabled={adjust.isPending}>+</GhostButton>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}

export function ProductsPage() {
  const products = useProducts()
  const categories = useCategories()
  const createCategory = useCreateCategory()
  const del = useDeleteProduct()
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold">Produtos e estoque</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (catName.trim()) createCategory.mutate(catName.trim(), { onSuccess: () => setCatName('') })
          }}
        >
          <input
            aria-label="Nova categoria"
            placeholder="Nova categoria"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <GhostButton type="submit">Adicionar categoria</GhostButton>
        </form>
        <Button onClick={() => setAdding(true)}>Novo produto</Button>
      </div>

      {categories.data && categories.data.length > 0 && (
        <p className="text-sm text-slate-600">Categorias: {categories.data.map((c) => c.name).join(', ')}</p>
      )}

      {adding && <ProductForm onDone={() => setAdding(false)} />}

      {products.isLoading && <p className="text-slate-500">Carregando…</p>}
      {products.data?.length === 0 && !adding && <p className="text-slate-500">Nenhum produto ainda. Cadastre o primeiro.</p>}

      <ul className="space-y-2">
        {products.data?.map((p) => (
          <li key={p.id}>
            <Card className="flex flex-wrap items-center gap-3">
              <div className="mr-auto">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-slate-600">
                  {formatCents(p.price_cents)} {p.category && `· ${p.category.name}`}
                </p>
                {p.low_stock && (
                  <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    Estoque baixo
                  </span>
                )}
              </div>
              <StockControl product={p} />
              <GhostButton
                onClick={() => {
                  if (window.confirm(`Excluir ${p.name}?`)) del.mutate(p.id)
                }}
              >
                Excluir
              </GhostButton>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
