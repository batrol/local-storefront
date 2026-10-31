<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_is_public_by_slug(): void
    {
        $shop = Shop::factory()->create(['slug' => 'loja-x']);

        $this->getJson('/api/shops/loja-x')->assertOk()->assertJsonPath('data.id', $shop->id);
        $this->getJson('/api/shops/nao-existe')->assertNotFound();
    }

    public function test_catalog_lists_only_active_products_of_that_shop_without_exact_stock(): void
    {
        $shop = Shop::factory()->create(['slug' => 'loja-x']);
        $other = Shop::factory()->create();
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Visible', 'stock' => 3]);
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Hidden', 'active' => false]);
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Sold out', 'stock' => 0]);
        Product::factory()->create(['shop_id' => $other->id, 'name' => 'Other shop']);

        $response = $this->getJson('/api/shops/loja-x/products')->assertOk();

        $response->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.stock')
            ->assertJsonMissing(['name' => 'Hidden'])
            ->assertJsonMissing(['name' => 'Other shop']);
        $this->assertSame([true, false], collect($response->json('data'))->sortBy('name')->pluck('in_stock')->values()->sortDesc()->values()->all());
    }
}
