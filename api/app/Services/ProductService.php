<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly CategoryRepository $categories,
        private readonly StockService $stock,
    ) {}

    /** @return Collection<int, Product> */
    public function list(int $shopId): Collection
    {
        return $this->products->listForShop($shopId);
    }

    public function find(int $shopId, int $id): Product
    {
        return $this->products->findForShop($shopId, $id);
    }

    /** @param array<string, mixed> $data */
    public function create(int $shopId, array $data): Product
    {
        $this->assertCategoryBelongsToShop($shopId, $data['category_id'] ?? null);
        $initialStock = (int) ($data['stock'] ?? 0);
        $data['stock'] = 0;

        $product = $this->products->create($shopId, $data);

        return $initialStock > 0
            ? $this->stock->adjust($product, $initialStock, 'initial stock')
            : $product;
    }

    /** @param array<string, mixed> $data */
    public function update(int $shopId, int $id, array $data): Product
    {
        $this->assertCategoryBelongsToShop($shopId, $data['category_id'] ?? null);
        unset($data['stock']); // stock only changes through StockService

        return $this->products->update($this->products->findForShop($shopId, $id), $data);
    }

    public function delete(int $shopId, int $id): void
    {
        $this->products->delete($this->products->findForShop($shopId, $id));
    }

    private function assertCategoryBelongsToShop(int $shopId, mixed $categoryId): void
    {
        if ($categoryId !== null && ! $this->categories->existsForShop($shopId, (int) $categoryId)) {
            throw ValidationException::withMessages(['category_id' => ['Invalid category.']]);
        }
    }
}
