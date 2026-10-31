<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly ProductRepository $products,
        private readonly StockService $stock,
    ) {}

    /**
     * Customer creates an order. Stock is decremented in the same transaction;
     * any failure rolls the whole order back.
     *
     * @param  array{customer_name: string, customer_phone: string, fulfillment: string, address?: string|null, notes?: string|null, items: list<array{product_id: int, quantity: int}>}  $data
     */
    public function create(Shop $shop, array $data): Order
    {
        $quantities = [];
        foreach ($data['items'] as $line) {
            $quantities[$line['product_id']] = ($quantities[$line['product_id']] ?? 0) + $line['quantity'];
        }

        $products = $this->products->activeByIds($shop->id, array_keys($quantities));
        if ($products->count() !== count($quantities)) {
            throw ValidationException::withMessages(['items' => [__('One or more products are unavailable.')]]);
        }

        if ($data['fulfillment'] === 'delivery' && blank($data['address'] ?? null)) {
            throw ValidationException::withMessages(['address' => [__('Address is required for delivery.')]]);
        }

        return DB::transaction(function () use ($shop, $data, $quantities, $products) {
            $lines = [];
            $total = 0;
            foreach ($quantities as $productId => $qty) {
                $product = $products[$productId];
                $lines[] = [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'unit_price_cents' => $product->price_cents,
                    'quantity' => $qty,
                ];
                $total += $product->price_cents * $qty;
            }

            $order = $this->orders->create([
                'shop_id' => $shop->id,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'fulfillment' => $data['fulfillment'],
                'address' => $data['fulfillment'] === 'delivery' ? $data['address'] : null,
                'notes' => $data['notes'] ?? null,
                'status' => OrderStatus::Pending,
                'total_cents' => $total,
            ], $lines);

            foreach ($quantities as $productId => $qty) {
                try {
                    $this->stock->adjust($products[$productId], -$qty, "order #{$order->id}");
                } catch (ValidationException) {
                    throw ValidationException::withMessages([
                        'items' => [__('Insufficient stock for :name.', ['name' => $products[$productId]->name])],
                    ]);
                }
            }

            return $order;
        });
    }

    /** @return Collection<int, Order> */
    public function list(int $shopId, ?OrderStatus $status): Collection
    {
        return $this->orders->listForShop($shopId, $status);
    }

    public function find(int $shopId, int $id): Order
    {
        return $this->orders->findForShop($shopId, $id);
    }

    /** Moves the order along its state machine; cancelling returns the stock. */
    public function changeStatus(int $shopId, int $id, OrderStatus $target): Order
    {
        return DB::transaction(function () use ($shopId, $id, $target) {
            $order = $this->orders->findForShop($shopId, $id);

            if (! $order->status->canBecome($target)) {
                throw ValidationException::withMessages([
                    'status' => [__('Cannot change from :from to :to.', ['from' => $order->status->label(), 'to' => $target->label()])],
                ]);
            }

            if ($target === OrderStatus::Cancelled) {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $this->stock->adjust($item->product, $item->quantity, "order #{$order->id} cancelled");
                    }
                }
            }

            return $this->orders->setStatus($order, $target);
        });
    }
}
