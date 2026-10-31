<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(private readonly CategoryRepository $categories) {}

    /** @return Collection<int, Category> */
    public function list(int $shopId): Collection
    {
        return $this->categories->listForShop($shopId);
    }

    public function create(int $shopId, string $name): Category
    {
        return $this->categories->create($shopId, $name);
    }

    public function update(int $shopId, int $id, string $name): Category
    {
        return $this->categories->update($this->categories->findForShop($shopId, $id), $name);
    }

    public function delete(int $shopId, int $id): void
    {
        $this->categories->delete($this->categories->findForShop($shopId, $id));
    }
}
