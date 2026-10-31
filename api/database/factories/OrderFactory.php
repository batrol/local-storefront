<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'shop_id' => Shop::factory(),
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->numerify('###########'),
            'fulfillment' => 'pickup',
            'status' => 'pending',
            'total_cents' => 1000,
        ];
    }
}
