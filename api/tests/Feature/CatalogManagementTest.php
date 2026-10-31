<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogManagementTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(): array
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/products')->assertUnauthorized();
        $this->getJson('/api/categories')->assertUnauthorized();
    }

    public function test_category_crud(): void
    {
        [$user] = $this->merchant();

        $id = $this->actingAs($user)->postJson('/api/categories', ['name' => 'Cabos'])
            ->assertCreated()->json('data.id');

        $this->actingAs($user)->putJson("/api/categories/$id", ['name' => 'Cabos USB'])
            ->assertOk()->assertJsonPath('data.name', 'Cabos USB');
        $this->actingAs($user)->getJson('/api/categories')->assertJsonCount(1, 'data');
        $this->actingAs($user)->deleteJson("/api/categories/$id")->assertNoContent();
        $this->assertDatabaseMissing('categories', ['id' => $id]);
    }

    public function test_product_crud_with_initial_stock_logged(): void
    {
        [$user, $shop] = $this->merchant();
        $cat = Category::factory()->create(['shop_id' => $shop->id]);

        $id = $this->actingAs($user)->postJson('/api/products', [
            'name' => 'Cabo USB-C', 'price_cents' => 1990, 'stock' => 12, 'category_id' => $cat->id,
        ])->assertCreated()
            ->assertJsonPath('data.stock', 12)
            ->assertJsonPath('data.category.id', $cat->id)
            ->json('data.id');

        $this->assertDatabaseHas('stock_movements', ['product_id' => $id, 'delta' => 12, 'balance' => 12]);

        $this->actingAs($user)->putJson("/api/products/$id", ['name' => 'Cabo USB-C 2m', 'stock' => 999])
            ->assertOk()
            ->assertJsonPath('data.name', 'Cabo USB-C 2m')
            ->assertJsonPath('data.stock', 12); // stock cannot be edited here

        $this->actingAs($user)->getJson("/api/products/$id")->assertOk();
        $this->actingAs($user)->deleteJson("/api/products/$id")->assertNoContent();
    }

    public function test_product_validation(): void
    {
        [$user] = $this->merchant();

        $this->actingAs($user)->postJson('/api/products', ['name' => 'X', 'price_cents' => -1])
            ->assertUnprocessable()->assertJsonValidationErrors('price_cents');
    }

    public function test_cannot_use_another_shops_category_or_products(): void
    {
        [$userA] = $this->merchant();
        [, $shopB] = $this->merchant();
        $catB = Category::factory()->create(['shop_id' => $shopB->id]);
        $productB = Product::factory()->create(['shop_id' => $shopB->id]);

        $this->actingAs($userA)->postJson('/api/products', [
            'name' => 'X', 'price_cents' => 100, 'category_id' => $catB->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('category_id');

        $this->actingAs($userA)->getJson("/api/products/{$productB->id}")->assertNotFound();
        $this->actingAs($userA)->putJson("/api/products/{$productB->id}", ['name' => 'hack'])->assertNotFound();
        $this->actingAs($userA)->deleteJson("/api/products/{$productB->id}")->assertNotFound();
        $this->actingAs($userA)->putJson("/api/categories/{$catB->id}", ['name' => 'hack'])->assertNotFound();
        $this->actingAs($userA)->postJson("/api/products/{$productB->id}/stock", ['delta' => 5, 'reason' => 'x'])->assertNotFound();
        $this->actingAs($userA)->getJson('/api/products')->assertJsonCount(0, 'data');
    }

    public function test_stock_adjustment_logs_movement_and_flags_low_stock(): void
    {
        [$user, $shop] = $this->merchant();
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock' => 10, 'low_stock_threshold' => 5]);

        $this->actingAs($user)->postJson("/api/products/{$product->id}/stock", ['delta' => -6, 'reason' => 'sold at counter'])
            ->assertOk()
            ->assertJsonPath('data.stock', 4)
            ->assertJsonPath('data.low_stock', true);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id, 'delta' => -6, 'balance' => 4, 'reason' => 'sold at counter',
        ]);
    }

    public function test_stock_cannot_go_negative(): void
    {
        [$user, $shop] = $this->merchant();
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock' => 2]);

        $this->actingAs($user)->postJson("/api/products/{$product->id}/stock", ['delta' => -3, 'reason' => 'x'])
            ->assertUnprocessable()->assertJsonValidationErrors('delta');
        $this->assertSame(2, $product->fresh()->stock);
    }

    public function test_stock_adjustment_requires_nonzero_delta_and_reason(): void
    {
        [$user, $shop] = $this->merchant();
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        $this->actingAs($user)->postJson("/api/products/{$product->id}/stock", ['delta' => 0])
            ->assertUnprocessable()->assertJsonValidationErrors(['delta', 'reason']);
    }
}
