<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository
{
    /** @return Collection<int, Product> */
    public function listForShop(int $shopId, bool $onlyActive = false): Collection
    {
        return Product::query()
            ->with('category')
            ->where('shop_id', $shopId)
            ->when($onlyActive, fn ($q) => $q->where('active', true))
            ->orderBy('name')
            ->get();
    }

    public function findForShop(int $shopId, int $id): Product
    {
        return Product::query()->with('category')->where('shop_id', $shopId)->findOrFail($id);
    }

    /** @param array<string, mixed> $data */
    public function create(int $shopId, array $data): Product
    {
        return Product::query()->create($data + ['shop_id' => $shopId])->load('category');
    }

    /** @param array<string, mixed> $data */
    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->load('category');
    }

    /**
     * Active products of a shop for the given ids, keyed by id.
     *
     * @param  list<int>  $ids
     * @return Collection<int, Product>
     */
    public function activeByIds(int $shopId, array $ids): Collection
    {
        return Product::query()
            ->where('shop_id', $shopId)
            ->where('active', true)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
