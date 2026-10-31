<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Repositories\ProductRepository;
use App\Repositories\ShopRepository;
use Illuminate\Database\Eloquent\Collection;

class PublicShopService
{
    public function __construct(
        private readonly ShopRepository $shops,
        private readonly ProductRepository $products,
    ) {}

    public function shop(string $slug): Shop
    {
        return $this->shops->findBySlug($slug) ?? abort(404);
    }

    /** @return Collection<int, Product> */
    public function catalog(Shop $shop): Collection
    {
        return $this->products->listForShop($shop->id, onlyActive: true);
    }
}
