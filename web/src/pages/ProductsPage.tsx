import { Button, Card, ErrorText, Field, GhostButton } from '@/components/ui'
import { firstError } from '@/lib/apiClient'
import { useAdjustStock, useCategories, useCreateCategory, useDeleteProduct, useProducts, useSaveProduct } from '@/lib/hooks'
import { formatCents, parseToCents } from '@/lib/money'
import type { Product } from '@/lib/types'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

function ProductForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const categories = useCategories()
  const save = useSaveProduct()
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const price = parseToCents(String(f.get('price')))
    if (price === null) return setError(t('products.invalidPrice'))
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
        <Field label={t('products.productName')} name="name" required />
        <Field label={t('products.price')} name="price" inputMode="decimal" placeholder={t('products.pricePlaceholder')} required />
        <Field label={t('products.initialStock')} name="stock" type="number" min={0} defaultValue={0} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('products.category')}</span>
          <select name="category_id" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">{t('products.noCategory')}</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={save.isPending}>{t('products.save')}</Button>
            <GhostButton type="button" onClick={onDone}>{t('common.cancel')}</GhostButton>
          </div>
        </div>
      </form>
    </Card>
  )
}

function StockControl({ product }: { product: Product }) {
  const { t } = useTranslation()
  const adjust = useAdjustStock()
  const [error, setError] = useState('')

  const apply = async (delta: number) => {
    const reason = delta > 0 ? 'manual entry' : 'manual exit'
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
        <GhostButton aria-label={t('products.decrease', { name: product.name })} onClick={() => void apply(-1)} disabled={adjust.isPending}>−</GhostButton>
        <span className="w-10 text-center font-semibold" data-testid={`stock-${product.id}`}>{product.stock}</span>
        <GhostButton aria-label={t('products.increase', { name: product.name })} onClick={() => void apply(1)} disabled={adjust.isPending}>+</GhostButton>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  )
}

export function ProductsPage() {
  const { t } = useTranslation()
  const products = useProducts()
  const categories = useCategories()
  const createCategory = useCreateCategory()
  const del = useDeleteProduct()
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold">{t('products.title')}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (catName.trim()) createCategory.mutate(catName.trim(), { onSuccess: () => setCatName('') })
          }}
        >
          <input
            aria-label={t('products.newCategory')}
            placeholder={t('products.newCategory')}
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <GhostButton type="submit">{t('products.addCategory')}</GhostButton>
        </form>
        <Button onClick={() => setAdding(true)}>{t('products.newProduct')}</Button>
      </div>

      {categories.data && categories.data.length > 0 && (
        <p className="text-sm text-slate-600">{t('products.categories', { list: categories.data.map((c) => c.name).join(', ') })}</p>
      )}

      {adding && <ProductForm onDone={() => setAdding(false)} />}

      {products.isLoading && <p className="text-slate-500">{t('common.loading')}</p>}
      {products.data?.length === 0 && !adding && <p className="text-slate-500">{t('products.empty')}</p>}

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
                    {t('products.lowStock')}
                  </span>
                )}
              </div>
              <StockControl product={p} />
              <GhostButton
                onClick={() => {
                  if (window.confirm(t('products.confirmDelete', { name: p.name }))) del.mutate(p.id)
                }}
              >
                {t('common.delete')}
              </GhostButton>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
