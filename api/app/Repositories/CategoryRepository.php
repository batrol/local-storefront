<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository
{
    /** @return Collection<int, Category> */
    public function listForShop(int $shopId): Collection
    {
        return Category::query()->where('shop_id', $shopId)->orderBy('name')->get();
    }

    public function findForShop(int $shopId, int $id): Category
    {
        return Category::query()->where('shop_id', $shopId)->findOrFail($id);
    }

    public function create(int $shopId, string $name): Category
    {
        return Category::query()->create(['shop_id' => $shopId, 'name' => $name]);
    }

    public function update(Category $category, string $name): Category
    {
        $category->update(['name' => $name]);

        return $category;
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }

    public function existsForShop(int $shopId, int $id): bool
    {
        return Category::query()->where('shop_id', $shopId)->whereKey($id)->exists();
    }
}
