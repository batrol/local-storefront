<?php

namespace App\Repositories;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;

class OrderRepository
{
    /** @return Collection<int, Order> */
    public function listForShop(int $shopId, ?OrderStatus $status = null): Collection
    {
        return Order::query()
            ->with('items')
            ->where('shop_id', $shopId)
            ->when($status, fn ($q) => $q->where('status', $status->value))
            ->latest('id')
            ->get();
    }

    public function findForShop(int $shopId, int $id): Order
    {
        return Order::query()->with('items')->where('shop_id', $shopId)->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array{product_id: int, name: string, unit_price_cents: int, quantity: int}>  $items
     */
    public function create(array $data, array $items): Order
    {
        $order = Order::query()->create($data);
        $order->items()->createMany($items);

        return $order->load('items');
    }

    public function setStatus(Order $order, OrderStatus $status): Order
    {
        $order->update(['status' => $status]);

        return $order->load('items');
    }
}
