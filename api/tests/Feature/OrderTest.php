<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function shopWithUser(): array
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id, 'slug' => 'loja-x']);

        return [$user, $shop];
    }

    private function body(array $items, array $over = []): array
    {
        return array_merge([
            'customer_name' => 'Joao',
            'customer_phone' => '11988887777',
            'fulfillment' => 'pickup',
            'items' => $items,
        ], $over);
    }

    public function test_customer_creates_order_and_stock_drops(): void
    {
        [, $shop] = $this->shopWithUser();
        $p = Product::factory()->create(['shop_id' => $shop->id, 'price_cents' => 2500, 'stock' => 10]);

        $this->postJson('/api/shops/loja-x/orders', $this->body([
            ['product_id' => $p->id, 'quantity' => 2],
            ['product_id' => $p->id, 'quantity' => 1],
        ]))->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.total_cents', 7500)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.quantity', 3);

        $this->assertSame(7, $p->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $p->id, 'delta' => -3]);
    }

    public function test_insufficient_stock_rejects_and_rolls_back_everything(): void
    {
        [, $shop] = $this->shopWithUser();
        $a = Product::factory()->create(['shop_id' => $shop->id, 'stock' => 5]);
        $b = Product::factory()->create(['shop_id' => $shop->id, 'stock' => 1]);

        $this->postJson('/api/shops/loja-x/orders', $this->body([
            ['product_id' => $a->id, 'quantity' => 2],
            ['product_id' => $b->id, 'quantity' => 2],
        ]))->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->assertSame(5, $a->fresh()->stock);
        $this->assertSame(1, $b->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_cannot_order_inactive_or_foreign_products(): void
    {
        [, $shop] = $this->shopWithUser();
        $inactive = Product::factory()->create(['shop_id' => $shop->id, 'active' => false]);
        $foreign = Product::factory()->create();

        foreach ([$inactive, $foreign] as $p) {
            $this->postJson('/api/shops/loja-x/orders', $this->body([['product_id' => $p->id, 'quantity' => 1]]))
                ->assertUnprocessable()->assertJsonValidationErrors('items');
        }
    }

    public function test_delivery_requires_address_and_validation_applies(): void
    {
        [, $shop] = $this->shopWithUser();
        $p = Product::factory()->create(['shop_id' => $shop->id]);

        $this->postJson('/api/shops/loja-x/orders', $this->body([['product_id' => $p->id, 'quantity' => 1]], ['fulfillment' => 'delivery']))
            ->assertUnprocessable()->assertJsonValidationErrors('address');

        $this->postJson('/api/shops/loja-x/orders', ['items' => []])
            ->assertUnprocessable()->assertJsonValidationErrors(['customer_name', 'customer_phone', 'fulfillment', 'items']);

        $this->postJson('/api/shops/nao-existe/orders', $this->body([['product_id' => $p->id, 'quantity' => 1]]))->assertNotFound();
    }

    public function test_merchant_lists_filters_and_reads_only_own_orders(): void
    {
        [$user, $shop] = $this->shopWithUser();
        Order::factory()->count(2)->create(['shop_id' => $shop->id]);
        Order::factory()->create(['shop_id' => $shop->id, 'status' => 'completed']);
        $foreign = Order::factory()->create();

        $this->actingAs($user)->getJson('/api/orders')->assertOk()->assertJsonCount(3, 'data');
        $this->actingAs($user)->getJson('/api/orders?status=completed')->assertJsonCount(1, 'data');
        $this->actingAs($user)->getJson("/api/orders/{$foreign->id}")->assertNotFound();
    }

    public function test_orders_require_authentication(): void
    {
        $this->getJson('/api/orders')->assertUnauthorized();
    }

    public function test_status_flow_and_invalid_transitions(): void
    {
        [$user, $shop] = $this->shopWithUser();
        $order = Order::factory()->create(['shop_id' => $shop->id]);

        foreach (['confirmed', 'ready', 'completed'] as $status) {
            $this->actingAs($user)->patchJson("/api/orders/{$order->id}/status", ['status' => $status])
                ->assertOk()->assertJsonPath('data.status', $status);
        }

        $this->actingAs($user)->patchJson("/api/orders/{$order->id}/status", ['status' => 'cancelled'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');

        $pending = Order::factory()->create(['shop_id' => $shop->id]);
        $this->actingAs($user)->patchJson("/api/orders/{$pending->id}/status", ['status' => 'completed'])
            ->assertUnprocessable();
        $this->actingAs($user)->patchJson("/api/orders/{$pending->id}/status", ['status' => 'bogus'])
            ->assertUnprocessable();
    }

    public function test_cancelling_returns_stock(): void
    {
        [$user, $shop] = $this->shopWithUser();
        $p = Product::factory()->create(['shop_id' => $shop->id, 'stock' => 10]);

        $id = $this->postJson('/api/shops/loja-x/orders', $this->body([['product_id' => $p->id, 'quantity' => 4]]))
            ->json('data.id');
        $this->assertSame(6, $p->fresh()->stock);

        $this->actingAs($user)->patchJson("/api/orders/$id/status", ['status' => 'cancelled'])->assertOk();

        $this->assertSame(10, $p->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $p->id, 'delta' => 4]);
    }

    public function test_cannot_change_status_of_another_shops_order(): void
    {
        [$user] = $this->shopWithUser();
        $foreign = Order::factory()->create();

        $this->actingAs($user)->patchJson("/api/orders/{$foreign->id}/status", ['status' => 'confirmed'])->assertNotFound();
    }
}
