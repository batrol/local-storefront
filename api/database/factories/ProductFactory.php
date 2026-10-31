<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'shop_id' => Shop::factory(),
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'price_cents' => fake()->numberBetween(500, 500000),
            'stock' => fake()->numberBetween(10, 50),
            'low_stock_threshold' => 5,
            'active' => true,
        ];
    }
}
